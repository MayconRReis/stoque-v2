
-- 1. EXTENSIONS (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
-- We handle status as text with check constraints for flexibility

-- 3. TABLES

-- INSUMOS
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

CREATE INDEX idx_insumos_codigo_senior ON public.insumos(codigo_senior);
CREATE INDEX idx_insumos_descricao_insumo ON public.insumos(descricao_insumo);
CREATE INDEX idx_insumos_palavras_chave ON public.insumos(palavras_chave);

-- RETURNS (Pallet/Shipment)
CREATE TABLE IF NOT EXISTS public.returns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_code text UNIQUE NOT NULL,
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

-- RETURN BOXES
CREATE TABLE IF NOT EXISTS public.return_boxes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    box_code text NOT NULL,
    box_number integer NOT NULL,
    pallet_order integer NOT NULL,
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

-- RETURN BOX ITEMS
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

-- RETURN ITEM REQUESTS
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

-- RETURN LOGS
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

-- RETURN LABEL LOGS
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

-- 4. TRIGGERS FOR updated_at

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

-- 5. FUNCTION & TRIGGER FOR return_code and box_code generation
-- Pattern return_code: RET-26-000001
-- Pattern box_code: RET-26-000001-CX01

CREATE OR REPLACE FUNCTION fn_generate_return_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year text;
    v_last_code text;
    v_last_num integer;
BEGIN
    -- Get last 2 digits of current year
    v_year := to_char(now(), 'YY');
    
    -- Find the highest return_code for the current year
    -- Format: RET-YY-XXXXXX
    SELECT return_code INTO v_last_code 
    FROM public.returns 
    WHERE return_code LIKE 'RET-' || v_year || '-%'
    ORDER BY return_code DESC 
    LIMIT 1;

    IF v_last_code IS NOT NULL THEN
        -- Extract the numeric part (last 6 digits)
        v_last_num := (substring(v_last_code from 8))::integer;
        v_last_num := v_last_num + 1;
    ELSE
        -- Start at 1 for the first return of the year
        v_last_num := 1;
    END IF;
    
    -- Format: RET-YY-XXXXXX
    NEW.return_code = 'RET-' || v_year || '-' || LPAD(v_last_num::text, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_return_code 
BEFORE INSERT ON public.returns 
FOR EACH ROW 
WHEN (NEW.return_code IS NULL)
EXECUTE PROCEDURE fn_generate_return_code();

-- FUNCTION TO AUTO-GENERATE BOX NUMBER AND ORDER
CREATE OR REPLACE FUNCTION fn_set_return_box_number()
RETURNS TRIGGER AS $$
DECLARE
    v_last_num integer;
BEGIN
    -- Lock the parent return row to prevent concurrent box number collisions for the same return
    -- This ensures we don't get two CX01 for the same return
    PERFORM id FROM public.returns WHERE id = NEW.return_id FOR UPDATE;

    -- Find current max box_number for this return
    SELECT COALESCE(MAX(box_number), 0) INTO v_last_num 
    FROM public.return_boxes 
    WHERE return_id = NEW.return_id;

    NEW.box_number := v_last_num + 1;
    NEW.pallet_order := v_last_num + 1; -- By default, same as box number

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_return_box_number
BEFORE INSERT ON public.return_boxes
FOR EACH ROW
WHEN (NEW.box_number IS NULL)
EXECUTE PROCEDURE fn_set_return_box_number();

CREATE OR REPLACE FUNCTION fn_generate_return_box_code()
RETURNS TRIGGER AS $$
DECLARE
    v_return_code text;
BEGIN
    -- Get the parent return code
    SELECT return_code INTO v_return_code FROM public.returns WHERE id = NEW.return_id;
    
    -- Format: ParentReturnCode-CX[PaddedBoxNumber]
    NEW.box_code = v_return_code || '-CX' || LPAD(NEW.box_number::text, 2, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_box_code 
BEFORE INSERT ON public.return_boxes 
FOR EACH ROW 
EXECUTE PROCEDURE fn_generate_return_box_code();

-- 6. RLS POLICIES (Assuming basic authenticated access for now)
-- You may want to harden these based on user roles

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_box_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_label_logs ENABLE ROW LEVEL SECURITY;

-- Simple All Access for authenticated (adjust as needed)
CREATE POLICY "Allow all to authenticated" ON public.insumos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.returns FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.return_boxes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.return_box_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.return_item_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.return_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON public.return_label_logs FOR ALL TO authenticated USING (true);
