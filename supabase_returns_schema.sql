-- consolidated_supabase_returns_schema.sql
-- Este arquivo contém a estrutura completa para o módulo de Retornos do Stoque+

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- INSUMOS (Tabela baseada no CSV de códigos Senior)
CREATE TABLE IF NOT EXISTS public.insumos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_senior text NOT NULL,
    descricao_insumo text NOT NULL,
    linha text,
    produto_acabado_descricao text,
    palavras_chave text,
    ativo boolean DEFAULT true,
    favorito boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insumos_codigo_senior ON public.insumos(codigo_senior);
CREATE INDEX IF NOT EXISTS idx_insumos_descricao_insumo ON public.insumos(descricao_insumo);
CREATE INDEX IF NOT EXISTS idx_insumos_palavras_chave ON public.insumos(palavras_chave);

-- RETURNS (Pallets/Retornos)
CREATE TABLE IF NOT EXISTS public.returns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_code text UNIQUE, -- Gerado automaticamente via trigger
    responsible_user_id uuid,
    responsible_name text,
    origin_sector text,
    notes text,
    status text NOT NULL DEFAULT 'em_montagem',
    created_by uuid,
    checked_by uuid,
    checked_at timestamptz,
    finalized_by uuid,
    finalized_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    cancelled_at timestamptz,
    cancelled_by uuid,
    cancel_reason text,
    CONSTRAINT returns_status_check CHECK (status IN ('em_montagem', 'aguardando_lote', 'aguardando_conferencia', 'conferido', 'finalizado', 'cancelado'))
);

-- RETURN BOXES (Caixas dentro do retorno)
CREATE TABLE IF NOT EXISTS public.return_boxes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    box_code text, -- Gerado automaticamente via trigger
    box_number integer, -- Gerado automaticamente via trigger
    pallet_order integer, -- Gerado automaticamente via trigger (igual ao box_number por padrão)
    status text NOT NULL DEFAULT 'aberta',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    cancelled_at timestamptz,
    cancelled_by uuid,
    cancel_reason text,
    label_printed_at timestamptz,
    label_printed_by uuid,
    CONSTRAINT return_boxes_status_check CHECK (status IN ('aberta', 'etiquetada', 'conferida', 'cancelada'))
);

-- RETURN BOX ITEMS (Itens dentro das caixas)
CREATE TABLE IF NOT EXISTS public.return_box_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    box_id uuid NOT NULL REFERENCES public.return_boxes(id) ON DELETE CASCADE,
    insumo_id uuid NOT NULL REFERENCES public.insumos(id),
    codigo_senior text NOT NULL,
    nome text NOT NULL,
    quantity numeric NOT NULL CHECK (quantity > 0),
    lot text,
    lot_pending boolean DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

-- RETURN ITEM REQUESTS (Solicitações de novos insumos)
CREATE TABLE IF NOT EXISTS public.return_item_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_name text NOT NULL,
    requested_description text,
    return_id uuid REFERENCES public.returns(id) ON DELETE SET NULL,
    box_id uuid REFERENCES public.return_boxes(id) ON DELETE SET NULL,
    requested_by uuid,
    status text NOT NULL DEFAULT 'pendente',
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT return_item_requests_status_check CHECK (status IN ('pendente', 'aprovado', 'recusado', 'ajuste_necessario'))
);

-- RETURN LOGS (Histórico operacional)
CREATE TABLE IF NOT EXISTS public.return_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id uuid REFERENCES public.returns(id) ON DELETE CASCADE,
    box_id uuid REFERENCES public.return_boxes(id) ON DELETE CASCADE,
    item_id uuid REFERENCES public.return_box_items(id) ON DELETE CASCADE,
    action text NOT NULL,
    description text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    created_by uuid,
    created_by_name text,
    created_at timestamptz DEFAULT now()
);

-- RETURN LABEL LOGS (Controle de impressões)
CREATE TABLE IF NOT EXISTS public.return_label_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    box_id uuid REFERENCES public.return_boxes(id) ON DELETE CASCADE,
    label_type text NOT NULL,
    printed_by uuid,
    printed_by_name text,
    printed_at timestamptz DEFAULT now(),
    reprint boolean DEFAULT false,
    CONSTRAINT return_label_logs_type_check CHECK (label_type IN ('caixa', 'retorno_geral'))
);

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_insumos_updated_at BEFORE UPDATE ON public.insumos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_return_boxes_updated_at BEFORE UPDATE ON public.return_boxes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_return_box_items_updated_at BEFORE UPDATE ON public.return_box_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_return_item_requests_updated_at BEFORE UPDATE ON public.return_item_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. RETURN_CODE GENERATION (YEARLY SEQUENCE)
-- Ex: RET-26-000001
CREATE OR REPLACE FUNCTION fn_generate_return_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year text;
    v_last_code text;
    v_last_num integer;
BEGIN
    -- Prefixo do ano (YY) baseado na data atual
    v_year := to_char(now(), 'YY');
    
    -- Busca o código mais alto deste ano para definir o próximo (evita falhas de gap de sequence manual)
    -- SELECT FOR UPDATE saltaria se tivéssemos concorrência alta, mas aqui usamos a tabela diretamente.
    -- Para segurança total em concorrência pesada, poderia-se usar uma tabela de controle de sequences por ano.
    SELECT return_code INTO v_last_code 
    FROM public.returns 
    WHERE return_code LIKE 'RET-' || v_year || '-%'
    ORDER BY return_code DESC 
    LIMIT 1;

    IF v_last_code IS NOT NULL THEN
        -- Extrai a parte numérica (últimos 6 dígitos após o segundo traço)
        -- RET-26-000001 -> pos 8 em diante
        v_last_num := (substring(v_last_code from 8))::integer;
        v_last_num := v_last_num + 1;
    ELSE
        -- Primeiro retorno do ano
        v_last_num := 1;
    END IF;
    
    NEW.return_code = 'RET-' || v_year || '-' || LPAD(v_last_num::text, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_return_code 
BEFORE INSERT ON public.returns 
FOR EACH ROW 
WHEN (NEW.return_code IS NULL)
EXECUTE PROCEDURE fn_generate_return_code();

-- 5. BOX NUMBER AND BOX CODE GENERATION
-- Gera CX01, CX02... e RET-26-000001-CX01
CREATE OR REPLACE FUNCTION fn_set_return_box_number_and_code()
RETURNS TRIGGER AS $$
DECLARE
    v_last_num integer;
    v_return_code text;
BEGIN
    -- 1. Bloqueia o retorno pai para garantir exclusividade na numeração das caixas (Race Condition Guard)
    SELECT return_code INTO v_return_code 
    FROM public.returns 
    WHERE id = NEW.return_id 
    FOR UPDATE;

    -- 2. Define o box_number baseado no total de caixas do retorno
    SELECT COALESCE(MAX(box_number), 0) INTO v_last_num 
    FROM public.return_boxes 
    WHERE return_id = NEW.return_id;

    NEW.box_number := v_last_num + 1;
    NEW.pallet_order := v_last_num + 1;

    -- 3. Define o box_code (Ex: RET-26-000001-CX01)
    NEW.box_code := v_return_code || '-CX' || LPAD(NEW.box_number::text, 2, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_box_details
BEFORE INSERT ON public.return_boxes 
FOR EACH ROW 
WHEN (NEW.box_number IS NULL OR NEW.box_code IS NULL)
EXECUTE PROCEDURE fn_set_return_box_number_and_code();

-- 6. ITEM LOT PENDING SYNC
CREATE OR REPLACE FUNCTION fn_sync_item_lot_pending()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lot IS NULL OR NEW.lot = '' THEN
        NEW.lot_pending := true;
    ELSE
        NEW.lot_pending := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_item_lot_pending 
BEFORE INSERT OR UPDATE OF lot ON public.return_box_items 
FOR EACH ROW 
EXECUTE PROCEDURE fn_sync_item_lot_pending();

-- 7. RLS (Row Level Security)
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_box_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_label_logs ENABLE ROW LEVEL SECURITY;

-- Permissões básicas para usuários autenticados (Ajustar conforme papéis de Admin futuramente se necessário)
CREATE POLICY "Auth access insumos" ON public.insumos FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access returns" ON public.returns FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access return_boxes" ON public.return_boxes FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access return_box_items" ON public.return_box_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access return_item_requests" ON public.return_item_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access return_logs" ON public.return_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access return_label_logs" ON public.return_label_logs FOR ALL TO authenticated USING (true);
