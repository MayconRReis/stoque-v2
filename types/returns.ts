
export enum ReturnStatus {
  EM_MONTAGEM = 'em_montagem',
  AGUARDANDO_LOTE = 'aguardando_lote',
  AGUARDANDO_CONFERENCIA = 'aguardando_conferencia',
  CONFERIDO = 'conferido',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado'
}

export enum BoxStatus {
  ABERTA = 'aberta',
  ETIQUETADA = 'etiquetada',
  CONFERIDA = 'conferida',
  CANCELADA = 'cancelada'
}

export enum ItemRequestStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  AJUSTE_NECESSARIO = 'ajuste_necessario'
}

export interface Insumo {
  id: string;
  codigo_senior: string;
  descricao_insumo: string;
  linha?: string;
  produto_acabado_descricao?: string;
  palavras_chave?: string;
  ativo: boolean;
  favorito: boolean;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  return_code: string;
  responsible_user_id?: string;
  responsible_name?: string;
  origin_sector?: string;
  notes?: string;
  status: ReturnStatus;
  created_by?: string;
  checked_by?: string;
  checked_at?: string;
  finalized_by?: string;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
}

export interface ReturnBox {
  id: string;
  return_id: string;
  box_code: string;
  box_number: number;
  pallet_order: number;
  status: BoxStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  label_printed_at?: string;
  label_printed_by?: string;
}

export interface ReturnBoxItem {
  id: string;
  return_id: string;
  box_id: string;
  insumo_id: string;
  codigo_senior: string;
  nome: string;
  quantity: number;
  lot?: string;
  lot_pending: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface ReturnItemRequest {
  id: string;
  requested_name: string;
  requested_description?: string;
  return_id?: string;
  box_id?: string;
  requested_by?: string;
  status: ItemRequestStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnLog {
  id: string;
  return_id?: string;
  box_id?: string;
  item_id?: string;
  action: string;
  description: string;
  old_value?: any;
  new_value?: any;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface ReturnLabelLog {
  id: string;
  return_id: string;
  box_id?: string;
  label_type: 'caixa' | 'retorno_geral';
  printed_by?: string;
  printed_by_name?: string;
  printed_at: string;
  reprint: boolean;
}
