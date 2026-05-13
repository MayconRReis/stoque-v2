/**
 * GUIA DE INTEGRAÇÃO - MÓDULO DE RETORNOS
 * 
 * Arquivo: returnService.ts + returns-types.ts
 * Data: Maio 2026
 * Versão: 1.0
 */

// ============================================================================
// 1. COMO INTEGRAR AO PROJETO
// ============================================================================

/**
 * PASSO 1: Copie os arquivos
 * 
 * - returns-types.ts → src/types/returns.ts (ou src/types/index.ts)
 * - returnService.ts → src/services/returnService.ts
 * 
 * IMPORTANTE: Ajuste o path da importação do supabaseClient em returnService.ts
 * conforme seu projeto:
 * 
 * import { supabase } from './supabaseClient'; // Ajuste aqui
 */

/**
 * PASSO 2: Atualize o types.ts principal
 * 
 * Importe os tipos do módulo de retornos:
 * 
 * import type {
 *   Return,
 *   ReturnBox,
 *   ReturnBoxItem,
 *   Insumo,
 *   // ... outros tipos conforme necessário
 * } from './returns';
 */

/**
 * PASSO 3: Use o serviço nos componentes
 * 
 * import { returnService, returnBoxService } from '@/services/returnService';
 * 
 * // Criar retorno
 * const newReturn = await returnService.createReturn({
 *   responsible_name: 'João Silva',
 *   origin_sector: 'Produção',
 *   created_by: userId
 * });
 */

// ============================================================================
// 2. ESTRUTURA DO SERVIÇO
// ============================================================================

/**
 * O returnService.ts está organizado em sub-serviços:
 * 
 * 1. insumoService
 *    - searchInsumos() - Busca com filtros e paginação
 *    - getInsumoById()
 *    - getInsumoByCodigoSenior()
 *    - createInsumo()
 *    - updateInsumo()
 *    - toggleFavoritoInsumo()
 * 
 * 2. returnService
 *    - createReturn() - Criar novo retorno
 *    - getReturnWithBoxes() - Buscar com caixas
 *    - getReturnFull() - Buscar com caixas + itens
 *    - listReturns() - Listar com filtros
 *    - updateReturn()
 *    - updateReturnStatus()
 *    - cancelReturn()
 * 
 * 3. returnBoxService
 *    - createBox() - Criar caixa (box_code é gerado automaticamente)
 *    - getBoxWithItems()
 *    - getBoxesByReturn()
 *    - updateBox()
 *    - updateBoxStatus()
 *    - markLabelPrinted() - Registra quando a etiqueta foi impressa
 *    - cancelBox()
 * 
 * 4. returnBoxItemService
 *    - createItem() - Adicionar item à caixa
 *    - getItemWithInsumo() - Buscar item com dados do insumo
 *    - getItemsByBox()
 *    - getPendingLotsByReturn() - Items com lot_pending = true
 *    - updateItem()
 *    - deleteItem()
 *    - updateLot() - Preencher o lote do item
 * 
 * 5. returnItemRequestService
 *    - createRequest() - Solicitação de novo insumo
 *    - getPendingRequests()
 *    - getAllRequests()
 *    - approveRequest() - Aprova e cria o insumo automaticamente
 *    - rejectRequest()
 * 
 * 6. returnLogsService
 *    - addLog() - Registra ações na auditoria
 *    - getLogsByReturn()
 *    - getLogsByBox()
 *    - getLogsByItem()
 * 
 * 7. returnLabelLogsService
 *    - addLabelLog() - Registra impressão de etiqueta
 *    - getLabelLogsByReturn()
 *    - getReprintCount()
 * 
 * 8. returnsDashboardService
 *    - getStats() - Estatísticas gerais
 *    - getPendingReturns() - Retornos com pendências
 * 
 * 9. returnsRealtimeService
 *    - subscribeToReturns()
 *    - subscribeToReturnBoxes()
 *    - subscribeToReturnBoxItems()
 */

// ============================================================================
// 3. EXEMPLOS DE USO
// ============================================================================

/**
 * EXEMPLO 1: Criar um novo retorno com uma caixa
 * 
 * ```typescript
 * import { returnService, returnBoxService } from '@/services/returnService';
 * 
 * // 1. Criar o retorno
 * const newReturn = await returnService.createReturn({
 *   responsible_name: 'João Silva',
 *   origin_sector: 'Produção',
 *   notes: 'Retorno de sobras',
 *   created_by: currentUserId
 * });
 * 
 * // 2. Criar primeira caixa (box_code é gerado automaticamente: RET-26-000001-CX01)
 * const box = await returnBoxService.createBox({
 *   return_id: newReturn.id,
 *   created_by: currentUserId
 * });
 * 
 * console.log(`Caixa criada: ${box.box_code}`);
 * ```
 */

/**
 * EXEMPLO 2: Adicionar itens a uma caixa
 * 
 * ```typescript
 * import { returnBoxItemService, insumoService } from '@/services/returnService';
 * 
 * // Buscar o insumo (ou solicitar se não existir)
 * let insumo = await insumoService.getInsumoByCodigoSenior('12345');
 * 
 * if (!insumo) {
 *   // Criar solicitação e aguardar aprovação
 *   // (para agora, criamos o insumo direto)
 *   insumo = await insumoService.createInsumo({
 *     codigo_senior: '12345',
 *     descricao_insumo: 'FRASCO 500ML TRANSPARENTE',
 *     ativo: true,
 *     favorito: false
 *   });
 * }
 * 
 * // Adicionar item à caixa
 * const item = await returnBoxItemService.createItem({
 *   return_id: returnId,
 *   box_id: boxId,
 *   insumo_id: insumo.id,
 *   codigo_senior: insumo.codigo_senior,
 *   nome: insumo.descricao_insumo,
 *   quantity: 500,
 *   lot: undefined, // Deixar vazio para marcar como pendente
 *   created_by: currentUserId
 * });
 * ```
 */

/**
 * EXEMPLO 3: Preencher lotes pendentes
 * 
 * ```typescript
 * import { returnBoxItemService, returnLogsService } from '@/services/returnService';
 * 
 * // Atualizar item com lote
 * const updatedItem = await returnBoxItemService.updateLot(
 *   itemId,
 *   '03260410810',
 *   currentUserId
 * );
 * 
 * // Registrar na auditoria
 * await returnLogsService.addLog({
 *   return_id: returnId,
 *   item_id: itemId,
 *   action: 'lot_filled',
 *   description: `Lote ${updatedItem.lot} preenchido`,
 *   created_by: currentUserId,
 *   created_by_name: currentUserName
 * });
 * ```
 */

/**
 * EXEMPLO 4: Listar retornos com filtros
 * 
 * ```typescript
 * import { returnService } from '@/services/returnService';
 * 
 * const results = await returnService.listReturns(
 *   {
 *     status: ['em_montagem', 'aguardando_lote'],
 *     origin_sector: 'Produção'
 *   },
 *   page = 0,
 *   pageSize = 50
 * );
 * 
 * console.log(`Total: ${results.total}, Página ${results.page}`);
 * console.log(results.data); // ReturnSummary[]
 * ```
 */

/**
 * EXEMPLO 5: Dashboard com estatísticas
 * 
 * ```typescript
 * import { returnsDashboardService } from '@/services/returnService';
 * 
 * const stats = await returnsDashboardService.getStats();
 * 
 * console.log(`
 *   Total de retornos: ${stats.totalReturns}
 *   Em montagem: ${stats.returnsEmMontagem}
 *   Aguardando lote: ${stats.returnsAguardandoLote}
 *   Lotes pendentes: ${stats.pendingLots}
 *   Solicitações pendentes: ${stats.pendingRequests}
 * `);
 * ```
 */

/**
 * EXEMPLO 6: Obter retornos com pendências
 * 
 * ```typescript
 * import { returnsDashboardService } from '@/services/returnService';
 * 
 * const pendingReturns = await returnsDashboardService.getPendingReturns();
 * 
 * // Cada item tem:
 * // - return_code
 * // - pendingLots: items que precisam de lote preenchido
 * // - openBoxes: caixas abertas
 * ```
 */

/**
 * EXEMPLO 7: Configurar realtime subscription
 * 
 * ```typescript
 * import { returnsRealtimeService } from '@/services/returnService';
 * 
 * const subscription = returnsRealtimeService.subscribeToReturns((payload) => {
 *   console.log('Mudança em returns:', payload);
 *   
 *   if (payload.eventType === 'INSERT') {
 *     console.log('Novo retorno criado:', payload.new);
 *   } else if (payload.eventType === 'UPDATE') {
 *     console.log('Retorno atualizado:', payload.new);
 *   }
 * });
 * 
 * // Para desinscrever:
 * // subscription.unsubscribe();
 * ```
 */

// ============================================================================
// 4. TIPOS E INTERFACES PRINCIPAIS
// ============================================================================

/**
 * ReturnStatus (status do retorno):
 * - 'em_montagem' → sendo montado, adicionando caixas/itens
 * - 'aguardando_lote' → todas as caixas criadas mas items precisam de lote
 * - 'aguardando_conferencia' → pronto para ser conferido
 * - 'conferido' → conferência realizada
 * - 'finalizado' → processado completamente
 * - 'cancelado' → cancelado
 */

/**
 * ReturnBoxStatus (status da caixa):
 * - 'aberta' → sendo montada
 * - 'etiquetada' → etiqueta foi impressa
 * - 'conferida' → conferência realizada
 * - 'cancelada' → cancelada
 */

/**
 * Interface Return (retorno):
 * {
 *   id: uuid
 *   return_code: "RET-26-000001" (gerado automaticamente)
 *   responsible_name?: string
 *   origin_sector?: string
 *   status: ReturnStatus
 *   notes?: string
 *   created_by?: uuid
 *   checked_by?: uuid
 *   finalized_by?: uuid
 *   created_at: timestamp
 *   updated_at: timestamp
 * }
 */

/**
 * Interface ReturnBox (caixa):
 * {
 *   id: uuid
 *   return_id: uuid
 *   box_code: "RET-26-000001-CX01" (gerado automaticamente)
 *   box_number: 1 (gerado automaticamente)
 *   pallet_order: 1
 *   status: ReturnBoxStatus
 *   label_printed_at?: timestamp
 *   created_at: timestamp
 * }
 */

/**
 * Interface ReturnBoxItem (item da caixa):
 * {
 *   id: uuid
 *   return_id: uuid
 *   box_id: uuid
 *   insumo_id: uuid
 *   codigo_senior: string
 *   nome: string
 *   quantity: number
 *   lot?: string
 *   lot_pending: boolean (true se lot não foi preenchido)
 *   created_at: timestamp
 * }
 */

// ============================================================================
// 5. MIGRAÇÃO DO CÓDIGO EXISTENTE
// ============================================================================

/**
 * Se vocês já têm CreateReturnModal.tsx, ReturnDetailView.tsx, etc:
 * 
 * 1. Importe os tipos do novo returns-types.ts
 * 2. Substitua queries diretas do Supabase pelos métodos do returnService
 * 3. Use as interfaces tipadas para evitar 'any'
 * 4. Configure subscriptions com returnsRealtimeService
 * 
 * ANTES (sem tipo):
 * const { data } = await supabase.from('returns').select('*');
 * 
 * DEPOIS (com tipo):
 * import { returnService } from '@/services/returnService';
 * const returns = await returnService.listReturns();
 * // returns.data é do tipo ReturnSummary[]
 */

// ============================================================================
// 6. PRÓXIMOS PASSOS
// ============================================================================

/**
 * 1. Integrar estes arquivos ao projeto stoque-v2
 * 2. Atualizar CreateReturnModal.tsx para usar returnService
 * 3. Criar contexto global do módulo de retornos (Context API ou Zustand)
 * 4. Implementar realtime com returnsRealtimeService
 * 5. Corrigir race condition do return_code com sequence SQL
 * 6. Testes unitários para cada sub-serviço
 * 7. Documentar erros e edge cases
 */

export default {};
