/**
 * Types para o módulo de Retornos do Stoque+
 * Gerados a partir do schema supabase_returns_schema.sql
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ReturnStatus {
  EM_MONTAGEM = 'em_montagem',
  AGUARDANDO_LOTE = 'aguardando_lote',
  AGUARDANDO_CONFERENCIA = 'aguardando_conferencia',
  CONFERIDO = 'conferido',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado'
}

export enum ReturnBoxStatus {
  ABERTA = 'aberta',
  ETIQUETADA = 'etiquetada',
  CONFERIDA = 'conferida',
  CANCELADA = 'cancelada'
}

export enum ReturnItemRequestStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  AJUSTE_NECESSARIO = 'ajuste_necessario'
}

export enum ReturnLabelType {
  CAIXA = 'caixa',
  RETORNO_GERAL = 'retorno_geral'
}

// ============================================================================
// TIPOS PRINCIPAIS
// ============================================================================

/**
 * Insumo (item de estoque/material)
 * Tabela: insumos
 */
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

/**
 * Retorno (Pallet/Retorno de produção)
 * Tabela: returns
 * Um retorno contém múltiplas caixas
 */
export interface Return {
  id: string;
  return_code: string; // Gerado automaticamente: RET-26-000001
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

/**
 * Caixa do Retorno
 * Tabela: return_boxes
 * Múltiplas caixas por retorno
 */
export interface ReturnBox {
  id: string;
  return_id: string;
  box_code: string; // Gerado automaticamente: RET-26-000001-CX01
  box_number: number; // 1, 2, 3... (gerado automaticamente)
  pallet_order: number; // Ordem do pallet (normalmente igual a box_number)
  status: ReturnBoxStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  label_printed_at?: string;
  label_printed_by?: string;
}

/**
 * Item dentro de uma Caixa de Retorno
 * Tabela: return_box_items
 * Múltiplos itens por caixa
 */
export interface ReturnBoxItem {
  id: string;
  return_id: string;
  box_id: string;
  insumo_id: string;
  codigo_senior: string;
  nome: string;
  quantity: number;
  lot?: string;
  lot_pending: boolean; // true se lot não foi preenchido
  created_by?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Solicitação de novo Insumo
 * Tabela: return_item_requests
 * Quando um insumo não existe no cadastro, é criada uma solicitação
 */
export interface ReturnItemRequest {
  id: string;
  requested_name: string;
  requested_description?: string;
  return_id?: string;
  box_id?: string;
  requested_by?: string;
  status: ReturnItemRequestStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Log de Auditoria do Retorno
 * Tabela: return_logs
 * Registra todas as ações no módulo de retornos
 */
export interface ReturnLog {
  id: string;
  return_id?: string;
  box_id?: string;
  item_id?: string;
  action: string; // 'created', 'updated', 'deleted', 'status_changed', etc.
  description: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

/**
 * Log de Impressão de Etiquetas
 * Tabela: return_label_logs
 * Controla quando e quem imprimiu as etiquetas
 */
export interface ReturnLabelLog {
  id: string;
  return_id: string;
  box_id?: string;
  label_type: ReturnLabelType;
  printed_by?: string;
  printed_by_name?: string;
  printed_at: string;
  reprint: boolean;
}

// ============================================================================
// TIPOS COMPOSTOS (para UI)
// ============================================================================

/**
 * Retorno com suas caixas hidratadas
 * Usado em listagens e detalhes
 */
export interface ReturnWithBoxes extends Return {
  return_boxes: ReturnBox[];
}

/**
 * Caixa de Retorno com seus itens hidratados
 */
export interface ReturnBoxWithItems extends ReturnBox {
  return_box_items: ReturnBoxItem[];
}

/**
 * Retorno completo com toda a hierarquia
 */
export interface ReturnFull extends Return {
  return_boxes: Array<ReturnBox & {
    return_box_items: ReturnBoxItem[];
  }>;
}

/**
 * Item de Retorno com dados do Insumo
 */
export interface ReturnBoxItemWithInsumo extends ReturnBoxItem {
  insumo?: Insumo;
}

// ============================================================================
// TIPOS PARA OPERAÇÕES
// ============================================================================

/**
 * DTO para criar um novo Retorno
 */
export interface CreateReturnInput {
  responsible_user_id?: string;
  responsible_name?: string;
  origin_sector?: string;
  notes?: string;
  created_by?: string;
}

/**
 * DTO para atualizar um Retorno
 */
export interface UpdateReturnInput {
  responsible_user_id?: string;
  responsible_name?: string;
  origin_sector?: string;
  notes?: string;
  status?: ReturnStatus;
  checked_by?: string;
  checked_at?: string;
  finalized_by?: string;
  finalized_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

/**
 * DTO para criar uma nova Caixa de Retorno
 */
export interface CreateReturnBoxInput {
  return_id: string;
  created_by?: string;
}

/**
 * DTO para atualizar uma Caixa de Retorno
 */
export interface UpdateReturnBoxInput {
  status?: ReturnBoxStatus;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  label_printed_at?: string;
  label_printed_by?: string;
}

/**
 * DTO para criar um Item de Retorno
 */
export interface CreateReturnBoxItemInput {
  return_id: string;
  box_id: string;
  insumo_id: string;
  codigo_senior: string;
  nome: string;
  quantity: number;
  lot?: string;
  created_by?: string;
}

/**
 * DTO para atualizar um Item de Retorno
 */
export interface UpdateReturnBoxItemInput {
  quantity?: number;
  lot?: string;
  updated_by?: string;
}

/**
 * DTO para criar uma Solicitação de Insumo
 */
export interface CreateReturnItemRequestInput {
  requested_name: string;
  requested_description?: string;
  return_id?: string;
  box_id?: string;
  requested_by?: string;
}

// ============================================================================
// TIPOS PARA FILTROS E QUERIES
// ============================================================================

/**
 * Filtros para buscar Retornos
 */
export interface ReturnFilters {
  status?: ReturnStatus | ReturnStatus[];
  origin_sector?: string;
  created_after?: string;
  created_before?: string;
  return_code?: string;
  responsible_name?: string;
  search?: string; // Busca por return_code ou responsible_name
}

/**
 * Filtros para buscar Insumos
 */
export interface InsumoFilters {
  ativo?: boolean;
  favorito?: boolean;
  search?: string; // Busca por descricao_insumo ou codigo_senior
  categoria?: string;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// TIPOS PARA DASHBOARD
// ============================================================================

/**
 * Estatísticas do módulo de retornos
 */
export interface ReturnsDashboardStats {
  totalReturns: number;
  returnsEmMontagem: number;
  returnsAguardandoLote: number;
  returnsAguardandoConferencia: number;
  returnsConfirmed: number;
  returnsFinalizado: number;
  returnsCancelado: number;
  totalBoxes: number;
  totalItems: number;
  pendingLots: number; // Items com lot_pending = true
  pendingRequests: number; // Solicitações de novos insumos pendentes
}

/**
 * Retorno pendente (para ReturnPendingPanel)
 */
export interface ReturnPendingInfo {
  return_id: string;
  return_code: string;
  status: ReturnStatus;
  box_id: string;
  box_code: string;
  pendingLots: Array<{
    item_id: string;
    nome: string;
    quantity: number;
  }>;
  openBoxes: number;
}

/**
 * Resumo de um Retorno (para listagem/cards)
 */
export interface ReturnSummary {
  id: string;
  return_code: string;
  status: ReturnStatus;
  responsible_name?: string;
  origin_sector?: string;
  box_count: number;
  item_count: number;
  pending_lots_count: number;
  created_at: string;
  updated_at: string;
}
