/**
 * returnService.ts
 * Serviço Supabase para o módulo de Retornos
 * Todas as operações CRUD e queries complexas
 */

import { supabase } from '../lib/supabase';
import {
  ReturnStatus,
  ReturnBoxStatus,
  ReturnItemRequestStatus
} from '../types/returns';
import type {
  Return,
  ReturnBox,
  ReturnBoxItem,
  Insumo,
  ReturnItemRequest,
  ReturnLog,
  ReturnLabelLog,
  ReturnWithBoxes,
  ReturnBoxWithItems,
  ReturnFull,
  ReturnBoxItemWithInsumo,
  CreateReturnInput,
  UpdateReturnInput,
  CreateReturnBoxInput,
  UpdateReturnBoxInput,
  CreateReturnBoxItemInput,
  UpdateReturnBoxItemInput,
  CreateReturnItemRequestInput,
  ReturnFilters,
  InsumoFilters,
  PaginatedResponse,
  ReturnsDashboardStats,
  ReturnPendingInfo,
  ReturnSummary
} from '../types/returns';

// ============================================================================
// INSUMOS
// ============================================================================

export const insumoService = {
  /**
   * Busca insumos com filtros e paginação
   */
  async searchInsumos(
    filters: InsumoFilters,
    page: number = 0,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Insumo>> {
    let query = supabase
      .from('insumos')
      .select('*', { count: 'exact' })
      .eq('ativo', filters.ativo ?? true);

    if (filters.search) {
      query = query.or(
        `descricao_insumo.ilike.%${filters.search}%,codigo_senior.ilike.%${filters.search}%,palavras_chave.ilike.%${filters.search}%`
      );
    }

    if (filters.favorito !== undefined) {
      query = query.eq('favorito', filters.favorito);
    }

    const { data, error, count } = await query
      .order('favorito', { ascending: false })
      .order('descricao_insumo', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error searching insumos:', error);
      throw error;
    }

    return {
      data: (data as Insumo[]) || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > (page + 1) * pageSize
    };
  },

  /**
   * Busca um insumo específico por ID
   */
  async getInsumoById(id: string): Promise<Insumo | null> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (data as Insumo) || null;
  },

  /**
   * Busca insumo por código Senior
   */
  async getInsumoByCodigoSenior(codigo: string): Promise<Insumo | null> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('codigo_senior', codigo)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (data as Insumo) || null;
  },

  /**
   * Lista todos os insumos favoritos
   */
  async getFavoritosInsumos(): Promise<Insumo[]> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .eq('favorito', true)
      .order('descricao_insumo', { ascending: true });

    if (error) throw error;
    return (data as Insumo[]) || [];
  },

  /**
   * Criar novo insumo
   */
  async createInsumo(insumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .insert([insumo])
      .select()
      .single();

    if (error) throw error;
    return data as Insumo;
  },

  /**
   * Atualizar insumo
   */
  async updateInsumo(id: string, updates: Partial<Insumo>): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Insumo;
  },

  /**
   * Toggle favorito
   */
  async toggleFavoritoInsumo(id: string, isFavorito: boolean): Promise<Insumo> {
    return this.updateInsumo(id, { favorito: isFavorito });
  }
};

// ============================================================================
// RETURNS (Retornos/Pallets)
// ============================================================================

export const returnService = {
  /**
   * Criar novo retorno (sem caixas)
   */
  async createReturn(input: CreateReturnInput): Promise<Return> {
    const { data, error } = await supabase
      .from('returns')
      .insert([{
        ...input,
        status: ReturnStatus.EM_MONTAGEM
      }].filter(Boolean))
      .select()
      .single();

    if (error) throw error;
    return data as Return;
  },

  /**
   * Buscar retorno por ID com suas caixas
   */
  async getReturnWithBoxes(returnId: string): Promise<ReturnWithBoxes | null> {
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (returnError && returnError.code !== 'PGRST116') {
      throw returnError;
    }

    if (!returnData) return null;

    const { data: boxes, error: boxesError } = await supabase
      .from('return_boxes')
      .select('*')
      .eq('return_id', returnId)
      .order('box_number', { ascending: true });

    if (boxesError) throw boxesError;

    return {
      ...(returnData as Return),
      return_boxes: (boxes as ReturnBox[]) || []
    } as ReturnWithBoxes;
  },

  /**
   * Buscar retorno completo (com caixas e itens)
   */
  async getReturnFull(returnId: string): Promise<ReturnFull | null> {
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (returnError && returnError.code !== 'PGRST116') {
      throw returnError;
    }

    if (!returnData) return null;

    const { data: boxes, error: boxesError } = await supabase
      .from('return_boxes')
      .select('*')
      .eq('return_id', returnId)
      .order('box_number', { ascending: true });

    if (boxesError) throw boxesError;

    // Para cada caixa, buscar seus itens
    const boxesWithItems = await Promise.all(
      ((boxes as ReturnBox[]) || []).map(async (box) => {
        const { data: items } = await supabase
          .from('return_box_items')
          .select('*')
          .eq('box_id', box.id)
          .order('created_at', { ascending: true });

        return {
          ...box,
          return_box_items: (items as ReturnBoxItem[]) || []
        };
      })
    );

    return {
      ...(returnData as Return),
      return_boxes: boxesWithItems
    } as ReturnFull;
  },

  /**
   * Listar retornos com filtros
   */
  async listReturns(
    filters?: ReturnFilters,
    page: number = 0,
    pageSize: number = 50
  ): Promise<PaginatedResponse<ReturnSummary>> {
    let query = supabase
      .from('returns')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in('status', statuses);
    }

    if (filters?.origin_sector) {
      query = query.eq('origin_sector', filters.origin_sector);
    }

    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters?.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    if (filters?.return_code) {
      query = query.ilike('return_code', `%${filters.return_code}%`);
    }

    if (filters?.responsible_name) {
      query = query.ilike('responsible_name', `%${filters.responsible_name}%`);
    }

    if (filters?.search) {
      query = query.or(
        `return_code.ilike.%${filters.search}%,responsible_name.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    // Buscar contagem de caixas e items para cada retorno
    const summaries: ReturnSummary[] = await Promise.all(
      ((data as Return[]) || []).map(async (ret) => {
        const { count: boxCount } = await supabase
          .from('return_boxes')
          .select('*', { count: 'exact' })
          .eq('return_id', ret.id);

        const { data: items } = await supabase
          .from('return_box_items')
          .select('*')
          .eq('return_id', ret.id);

        const pendingLotsCount = ((items as ReturnBoxItem[]) || []).filter((i) => i.lot_pending).length;

        return {
          id: ret.id,
          return_code: ret.return_code,
          status: ret.status,
          responsible_name: ret.responsible_name,
          origin_sector: ret.origin_sector,
          box_count: boxCount || 0,
          item_count: items?.length || 0,
          pending_lots_count: pendingLotsCount,
          created_at: ret.created_at,
          updated_at: ret.updated_at
        };
      })
    );

    return {
      data: summaries,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > (page + 1) * pageSize
    };
  },

  /**
   * Atualizar retorno
   */
  async updateReturn(id: string, updates: UpdateReturnInput): Promise<Return> {
    const { data, error } = await supabase
      .from('returns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Return;
  },

  /**
   * Alterar status do retorno
   */
  async updateReturnStatus(id: string, status: ReturnStatus, updatedBy?: string): Promise<Return> {
    return this.updateReturn(id, { status, created_by: updatedBy });
  },

  /**
   * Cancelar retorno
   */
  async cancelReturn(
    id: string,
    cancelReason: string,
    cancelledBy?: string
  ): Promise<Return> {
    return this.updateReturn(id, {
      status: ReturnStatus.CANCELADO,
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancel_reason: cancelReason
    });
  }
};

// ============================================================================
// RETURN BOXES (Caixas)
// ============================================================================

export const returnBoxService = {
  /**
   * Criar nova caixa de retorno
   */
  async createBox(input: CreateReturnBoxInput): Promise<ReturnBox> {
    const { data, error } = await supabase
      .from('return_boxes')
      .insert([{
        ...input,
        status: ReturnBoxStatus.ABERTA
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ReturnBox;
  },

  /**
   * Buscar caixa com seus itens
   */
  async getBoxWithItems(boxId: string): Promise<ReturnBoxWithItems | null> {
    const { data: boxData, error: boxError } = await supabase
      .from('return_boxes')
      .select('*')
      .eq('id', boxId)
      .single();

    if (boxError && boxError.code !== 'PGRST116') {
      throw boxError;
    }

    if (!boxData) return null;

    const { data: items, error: itemsError } = await supabase
      .from('return_box_items')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...(boxData as ReturnBox),
      return_box_items: (items as ReturnBoxItem[]) || []
    } as ReturnBoxWithItems;
  },

  /**
   * Listar caixas por retorno
   */
  async getBoxesByReturn(returnId: string): Promise<ReturnBox[]> {
    const { data, error } = await supabase
      .from('return_boxes')
      .select('*')
      .eq('return_id', returnId)
      .order('box_number', { ascending: true });

    if (error) throw error;
    return (data as ReturnBox[]) || [];
  },

  /**
   * Atualizar caixa
   */
  async updateBox(id: string, updates: UpdateReturnBoxInput): Promise<ReturnBox> {
    const { data, error } = await supabase
      .from('return_boxes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ReturnBox;
  },

  /**
   * Alterar status da caixa
   */
  async updateBoxStatus(id: string, status: ReturnBoxStatus): Promise<ReturnBox> {
    return this.updateBox(id, { status });
  },

  /**
   * Registrar impressão de etiqueta
   */
  async markLabelPrinted(
    id: string,
    printedBy?: string,
    printedByName?: string
  ): Promise<ReturnBox> {
    return this.updateBox(id, {
      label_printed_at: new Date().toISOString(),
      label_printed_by: printedBy,
      status: ReturnBoxStatus.ETIQUETADA
    });
  },

  /**
   * Cancelar caixa
   */
  async cancelBox(
    id: string,
    cancelReason: string,
    cancelledBy?: string
  ): Promise<ReturnBox> {
    return this.updateBox(id, {
      status: ReturnBoxStatus.CANCELADA,
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancel_reason: cancelReason
    });
  }
};

// ============================================================================
// RETURN BOX ITEMS (Itens)
// ============================================================================

export const returnBoxItemService = {
  /**
   * Criar novo item em uma caixa
   */
  async createItem(input: CreateReturnBoxItemInput): Promise<ReturnBoxItem> {
    const { data, error } = await supabase
      .from('return_box_items')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as ReturnBoxItem;
  },

  /**
   * Buscar item com dados do insumo
   */
  async getItemWithInsumo(itemId: string): Promise<ReturnBoxItemWithInsumo | null> {
    const { data: itemData, error: itemError } = await supabase
      .from('return_box_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError && itemError.code !== 'PGRST116') {
      throw itemError;
    }

    if (!itemData) return null;

    const insumo = await insumoService.getInsumoById((itemData as ReturnBoxItem).insumo_id);

    return {
      ...(itemData as ReturnBoxItem),
      insumo
    } as ReturnBoxItemWithInsumo;
  },

  /**
   * Listar itens por caixa
   */
  async getItemsByBox(boxId: string): Promise<ReturnBoxItem[]> {
    const { data, error } = await supabase
      .from('return_box_items')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ReturnBoxItem[]) || [];
  },

  /**
   * Listar itens com lotes pendentes por retorno
   */
  async getPendingLotsByReturn(returnId: string): Promise<ReturnBoxItem[]> {
    const { data, error } = await supabase
      .from('return_box_items')
      .select('*')
      .eq('return_id', returnId)
      .eq('lot_pending', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ReturnBoxItem[]) || [];
  },

  /**
   * Atualizar item
   */
  async updateItem(id: string, updates: UpdateReturnBoxItemInput): Promise<ReturnBoxItem> {
    const { data, error } = await supabase
      .from('return_box_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ReturnBoxItem;
  },

  /**
   * Deletar item
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('return_box_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Preencher lote de um item
   */
  async updateLot(id: string, lot: string, updatedBy?: string): Promise<ReturnBoxItem> {
    return this.updateItem(id, { lot, updated_by: updatedBy });
  }
};

// ============================================================================
// RETURN ITEM REQUESTS (Solicitações de novos insumos)
// ============================================================================

export const returnItemRequestService = {
  /**
   * Criar solicitação de novo insumo
   */
  async createRequest(input: CreateReturnItemRequestInput): Promise<ReturnItemRequest> {
    const { data, error } = await supabase
      .from('return_item_requests')
      .insert([{
        ...input,
        status: ReturnItemRequestStatus.PENDENTE
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ReturnItemRequest;
  },

  /**
   * Listar solicitações pendentes
   */
  async getPendingRequests(): Promise<ReturnItemRequest[]> {
    const { data, error } = await supabase
      .from('return_item_requests')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ReturnItemRequest[]) || [];
  },

  /**
   * Listar todas as solicitações
   */
  async getAllRequests(
    page: number = 0,
    pageSize: number = 50
  ): Promise<PaginatedResponse<ReturnItemRequest>> {
    const { data, error, count } = await supabase
      .from('return_item_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    return {
      data: (data as ReturnItemRequest[]) || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > (page + 1) * pageSize
    };
  },

  /**
   * Aprovar solicitação (e criar o insumo)
   */
  async approveRequest(
    id: string,
    insumoData: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>,
    reviewedBy?: string
  ): Promise<{ request: ReturnItemRequest; insumo: Insumo }> {
    // 1. Criar o insumo
    const insumo = await insumoService.createInsumo(insumoData);

    // 2. Atualizar a solicitação como aprovada
    const { data: request, error } = await supabase
      .from('return_item_requests')
      .update({
        status: ReturnItemRequestStatus.APROVADO,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { request: request as ReturnItemRequest, insumo };
  },

  /**
   * Rejeitar solicitação
   */
  async rejectRequest(
    id: string,
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<ReturnItemRequest> {
    const { data, error } = await supabase
      .from('return_item_requests')
      .update({
        status: ReturnItemRequestStatus.RECUSADO,
        admin_notes: adminNotes,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ReturnItemRequest;
  }
};

// ============================================================================
// RETURN LOGS (Auditoria)
// ============================================================================

export const returnLogsService = {
  /**
   * Adicionar entrada de log
   */
  async addLog(log: Omit<ReturnLog, 'id' | 'created_at'>): Promise<ReturnLog> {
    const { data, error } = await supabase
      .from('return_logs')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data as ReturnLog;
  },

  /**
   * Listar logs por retorno
   */
  async getLogsByReturn(returnId: string): Promise<ReturnLog[]> {
    const { data, error } = await supabase
      .from('return_logs')
      .select('*')
      .eq('return_id', returnId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ReturnLog[]) || [];
  },

  /**
   * Listar logs por caixa
   */
  async getLogsByBox(boxId: string): Promise<ReturnLog[]> {
    const { data, error } = await supabase
      .from('return_logs')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ReturnLog[]) || [];
  },

  /**
   * Listar logs por item
   */
  async getLogsByItem(itemId: string): Promise<ReturnLog[]> {
    const { data, error } = await supabase
      .from('return_logs')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ReturnLog[]) || [];
  }
};

// ============================================================================
// RETURN LABEL LOGS (Impressões)
// ============================================================================

export const returnLabelLogsService = {
  /**
   * Registrar impressão de etiqueta
   */
  async addLabelLog(log: Omit<ReturnLabelLog, 'id' | 'printed_at'>): Promise<ReturnLabelLog> {
    const { data, error } = await supabase
      .from('return_label_logs')
      .insert([
        {
          ...log,
          printed_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as ReturnLabelLog;
  },

  /**
   * Listar impressões por retorno
   */
  async getLabelLogsByReturn(returnId: string): Promise<ReturnLabelLog[]> {
    const { data, error } = await supabase
      .from('return_label_logs')
      .select('*')
      .eq('return_id', returnId)
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return (data as ReturnLabelLog[]) || [];
  },

  /**
   * Contar reimpressões por caixa
   */
  async getReprintCount(boxId: string): Promise<number> {
    const { data, error, count } = await supabase
      .from('return_label_logs')
      .select('*', { count: 'exact' })
      .eq('box_id', boxId)
      .eq('reprint', true);

    if (error) throw error;
    return count || 0;
  }
};

// ============================================================================
// DASHBOARD E ESTATÍSTICAS
// ============================================================================

export const returnsDashboardService = {
  /**
   * Obter estatísticas gerais do módulo de retornos
   */
  async getStats(): Promise<ReturnsDashboardStats> {
    // Contar retornos por status
    const getCountByStatus = async (status: ReturnStatus) => {
      const { count, error } = await supabase
        .from('returns')
        .select('*', { count: 'exact' })
        .eq('status', status);

      if (error) throw error;
      return count || 0;
    };

    // Contar caixas
    const { count: totalBoxes, error: boxesError } = await supabase
      .from('return_boxes')
      .select('*', { count: 'exact' });

    if (boxesError) throw boxesError;

    // Contar items
    const { count: totalItems, error: itemsError } = await supabase
      .from('return_box_items')
      .select('*', { count: 'exact' });

    if (itemsError) throw itemsError;

    // Contar lotes pendentes
    const { count: pendingLots, error: lotsError } = await supabase
      .from('return_box_items')
      .select('*', { count: 'exact' })
      .eq('lot_pending', true);

    if (lotsError) throw lotsError;

    // Contar solicitações pendentes
    const { count: pendingRequests, error: requestsError } = await supabase
      .from('return_item_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'pendente');

    if (requestsError) throw requestsError;

    const [
      totalReturnsResult,
      returnsEmMontagem,
      returnsAguardandoLote,
      returnsAguardandoConferencia,
      returnsConfirmed,
      returnsFinalizado,
      returnsCancelado
    ] = await Promise.all([
      supabase.from('returns').select('*', { count: 'exact' }),
      getCountByStatus(ReturnStatus.EM_MONTAGEM),
      getCountByStatus(ReturnStatus.AGUARDANDO_LOTE),
      getCountByStatus(ReturnStatus.AGUARDANDO_CONFERENCIA),
      getCountByStatus(ReturnStatus.CONFERIDO),
      getCountByStatus(ReturnStatus.FINALIZADO),
      getCountByStatus(ReturnStatus.CANCELADO)
    ]);

    return {
      totalReturns: totalReturnsResult.count || 0,
      returnsEmMontagem,
      returnsAguardandoLote,
      returnsAguardandoConferencia,
      returnsConfirmed,
      returnsFinalizado,
      returnsCancelado,
      totalBoxes: totalBoxes || 0,
      totalItems: totalItems || 0,
      pendingLots: pendingLots || 0,
      pendingRequests: pendingRequests || 0
    };
  },

  /**
   * Obter retornos com pendências para o painel de monitoramento
   */
  async getPendingReturns(): Promise<ReturnPendingInfo[]> {
    // Busca retornos que NÃO estão finalizados nem cancelados
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select('*')
      .in('status', [
        ReturnStatus.EM_MONTAGEM,
        ReturnStatus.AGUARDANDO_LOTE,
        ReturnStatus.AGUARDANDO_CONFERENCIA,
        ReturnStatus.CONFERIDO
      ]);

    if (returnsError) throw returnsError;

    const pendingReturns: ReturnPendingInfo[] = await Promise.all(
      ((returns as Return[]) || []).map(async (ret) => {
        // Buscar caixas
        const { data: boxes } = await supabase
          .from('return_boxes')
          .select('*')
          .eq('return_id', ret.id)
          .in('status', [ReturnBoxStatus.ABERTA, ReturnBoxStatus.ETIQUETADA]);

        // Buscar items com lotes pendentes
        const { data: items } = await supabase
          .from('return_box_items')
          .select('*')
          .eq('return_id', ret.id)
          .eq('lot_pending', true);

        return {
          return_id: ret.id,
          return_code: ret.return_code,
          status: ret.status,
          box_id: (boxes as ReturnBox[])?.[0]?.id || '',
          box_code: (boxes as ReturnBox[])?.[0]?.box_code || '',
          pendingLots: ((items as ReturnBoxItem[]) || []).map((i) => ({
            item_id: i.id,
            nome: i.nome,
            quantity: i.quantity
          })),
          openBoxes: (boxes?.length) || 0
        };
      })
    );

    return pendingReturns;
  }
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export const returnsRealtimeService = {
  /**
   * Subscribe a mudanças em returns
   */
  subscribeToReturns(callback: (payload: any) => void) {
    return supabase
      .channel('returns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns'
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe a mudanças em return_boxes
   */
  subscribeToReturnBoxes(callback: (payload: any) => void) {
    return supabase
      .channel('return_boxes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_boxes'
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe a mudanças em return_box_items
   */
  subscribeToReturnBoxItems(callback: (payload: any) => void) {
    return supabase
      .channel('return_box_items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_box_items'
        },
        callback
      )
      .subscribe();
  }
};

const returnsService = {
  insumoService,
  returnService,
  returnBoxService,
  returnBoxItemService,
  returnItemRequestService,
  returnLogsService,
  returnLabelLogsService,
  returnsDashboardService,
  returnsRealtimeService
};

export default returnsService;
