
import { supabase } from '../lib/supabase';
import { 
  Return, 
  ReturnBox, 
  ReturnBoxItem, 
  ReturnStatus, 
  BoxStatus, 
  Insumo, 
  ReturnLog,
  ItemRequestStatus
} from '../types/returns';

export const returnsService = {
  /**
   * INSUMOS
   */
  async getInsumosSearch(query: string) {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .or(`codigo_senior.ilike.%${query}%,descricao_insumo.ilike.%${query}%,palavras_chave.ilike.%${query}%`)
      .eq('ativo', true)
      .limit(20);
    
    if (error) throw error;
    return data as Insumo[];
  },

  async getRecentInsumos() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data as Insumo[];
  },

  async getFavoriteInsumos() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .eq('favorito', true)
      .limit(20);
    
    if (error) throw error;
    return data as Insumo[];
  },

  /**
   * RETURNS
   */
  async createReturn(payload: Partial<Return>) {
    const { data, error } = await supabase
      .from('returns')
      .insert([{
        ...payload,
        status: ReturnStatus.EM_MONTAGEM
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    await this.createReturnLog({
      return_id: data.id,
      action: 'retorno_criado',
      description: `Retorno ${data.return_code} iniciado.`
    });

    return data as Return;
  },

  async getReturnsPaginated(page: number = 1, limit: number = 10, filters: any = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('returns')
      .select('*', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('return_code', `%${filters.search}%`);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data as Return[], count };
  },

  async getReturnById(id: string) {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        return_boxes (
          *,
          return_box_items (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * BOXES
   */
  async createReturnBox(returnId: string) {
    // box_number, pallet_order and box_code are handled by DB triggers
    const { data, error } = await supabase
      .from('return_boxes')
      .insert([{
        return_id: returnId,
        status: BoxStatus.ABERTA
      }])
      .select()
      .single();
    
    if (error) throw error;

    await this.createReturnLog({
      return_id: returnId,
      box_id: data.id,
      action: 'caixa_criada',
      description: `Caixa ${data.box_number} adicionada ao retorno.`
    });

    return data as ReturnBox;
  },

  async cancelBox(boxId: string, reason: string, userId: string) {
    const { data: box } = await supabase.from('return_boxes').select('return_id').eq('id', boxId).single();

    const { data, error } = await supabase
      .from('return_boxes')
      .update({
        status: BoxStatus.CANCELADA,
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancel_reason: reason
      })
      .eq('id', boxId)
      .select()
      .single();
    
    if (error) throw error;

    await this.createReturnLog({
      return_id: box?.return_id,
      box_id: boxId,
      action: 'caixa_cancelada',
      description: `Caixa cancelada. Motivo: ${reason}`
    });

    return data as ReturnBox;
  },

  /**
   * ITEMS
   */
  async addItemToBox(payload: { 
    return_id: string, 
    box_id: string, 
    insumo_id: string, 
    quantity: number, 
    lot?: string,
    created_by?: string 
  }) {
    const { data: insumo } = await supabase
      .from('insumos')
      .select('codigo_senior, descricao_insumo')
      .eq('id', payload.insumo_id)
      .single();

    if (!insumo) throw new Error('Insumo não encontrado');

    const { data, error } = await supabase
      .from('return_box_items')
      .insert([{
        return_id: payload.return_id,
        box_id: payload.box_id,
        insumo_id: payload.insumo_id,
        codigo_senior: insumo.codigo_senior,
        nome: insumo.descricao_insumo,
        quantity: payload.quantity,
        lot: payload.lot || null,
        lot_pending: !payload.lot,
        created_by: payload.created_by
      }])
      .select()
      .single();
    
    if (error) throw error;

    await this.createReturnLog({
      return_id: payload.return_id,
      box_id: payload.box_id,
      item_id: data.id,
      action: 'item_adicionado',
      description: `Adicionado ${payload.quantity} de ${insumo.descricao_insumo}`
    });

    return data as ReturnBoxItem;
  },

  async updateItemLot(itemId: string, lot: string, userId: string) {
    const { data: current } = await supabase.from('return_box_items').select('*').eq('id', itemId).single();

    const { data, error } = await supabase
      .from('return_box_items')
      .update({
        lot,
        lot_pending: !lot,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;

    await this.createReturnLog({
      return_id: current?.return_id,
      box_id: current?.box_id,
      item_id: itemId,
      action: 'lote_alterado',
      description: `Lote alterado de "${current?.lot || 'vazio'}" para "${lot}"`,
      old_value: { lot: current?.lot },
      new_value: { lot }
    });

    return data as ReturnBoxItem;
  },

  async updateItemQuantity(itemId: string, quantity: number, userId: string) {
    const { data: current } = await supabase.from('return_box_items').select('*').eq('id', itemId).single();

    const { data, error } = await supabase
      .from('return_box_items')
      .update({
        quantity,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;

    await this.createReturnLog({
      return_id: current?.return_id,
      box_id: current?.box_id,
      item_id: itemId,
      action: 'item_editado',
      description: `Quantidade alterada de ${current?.quantity} para ${quantity}`,
      old_value: { quantity: current?.quantity },
      new_value: { quantity }
    });

    return data as ReturnBoxItem;
  },

  /**
   * REQUESTS
   */
  async requestNewInsumo(payload: {
    requested_name: string,
    requested_description?: string,
    return_id?: string,
    box_id?: string,
    requested_by?: string
  }) {
    const { data, error } = await supabase
      .from('return_item_requests')
      .insert([{
        ...payload,
        status: ItemRequestStatus.PENDENTE
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * LOGS
   */
  async getReturnLogs(returnId: string) {
    const { data, error } = await supabase
      .from('return_logs')
      .select('*')
      .eq('return_id', returnId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as ReturnLog[];
  },

  async createReturnLog(payload: Partial<ReturnLog>) {
    const { data, error } = await supabase
      .from('return_logs')
      .insert([payload]);
    
    if (error) throw error;
    return data;
  }
};
