
import React from 'react';
import { Search, Filter, ChevronDown, CheckCircle2, Package, Container, Loader2, Plus } from 'lucide-react';
import { SubTabs } from '../SubTabs';
import QuickSearch from '../QuickSearch';
import { RotativeStockManager } from '../RotativeStockManager';
import InventoryCard from '../InventoryCard';
import { 
  SheetRow, 
  WarehouseSlot, 
  SlotContent, 
  InspectionData, 
  translateSlotContent,
  User as AppUser
} from '../../types';

interface StockModuleProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  inventorySearch: string;
  setInventorySearch: (val: string) => void;
  inventoryTypeFilter: SlotContent | 'ALL' | 'CONTAINER';
  setInventoryTypeFilter: (val: SlotContent | 'ALL' | 'CONTAINER') => void;
  isInventoryFilterOpen: boolean;
  setIsInventoryFilterOpen: (val: boolean) => void;
  selectedPallets: string[];
  setSelectedPallets: (val: string[] | ((prev: string[]) => string[])) => void;
  setIsShipmentModalOpen: (val: boolean) => void;
  setIsBulkConfirmOpen: (val: boolean) => void;
  filteredInventory: { row: SheetRow; inspection: InspectionData; idx: number }[];
  togglePalletSelection: (rowId: string, palletIdx: number) => void;
  handleShowDetail: (row: SheetRow, inspection: InspectionData, idx: number) => void;
  handleEditPallet: (row: SheetRow, inspection: InspectionData, idx: number) => void;
  handleDeletePallet: (rowId: string, idx: number) => void;
  user: AppUser | null;
  hasMoreInventory: boolean;
  loadMoreInventory: () => Promise<void>;
  isLoadingMore: boolean;
  slots: WarehouseSlot[];
  onUpdateSlot: (slot: WarehouseSlot) => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  onAddHistory: (entry: any) => Promise<void>;
  setMovementInitialContext: (ctx: any) => void;
  setIsMovementModalOpen: (val: boolean) => void;
}

export const StockModule: React.FC<StockModuleProps> = ({
  activeSubTab,
  setActiveSubTab,
  inventorySearch,
  setInventorySearch,
  inventoryTypeFilter,
  setInventoryTypeFilter,
  isInventoryFilterOpen,
  setIsInventoryFilterOpen,
  selectedPallets,
  setSelectedPallets,
  setIsShipmentModalOpen,
  setIsBulkConfirmOpen,
  filteredInventory,
  togglePalletSelection,
  handleShowDetail,
  handleEditPallet,
  handleDeletePallet,
  user,
  hasMoreInventory,
  loadMoreInventory,
  isLoadingMore,
  slots,
  onUpdateSlot,
  showNotification,
  onAddHistory,
  setMovementInitialContext,
  setIsMovementModalOpen
}) => {
  const stockTabs = [
    { id: 'general', label: 'Estoque Geral' },
    { id: 'quicksearch', label: 'Consulta Rápida' },
    { id: 'rotative', label: 'Estoque Rotativo' },
    { id: 'containers', label: 'Containers' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <SubTabs 
        tabs={stockTabs} 
        activeSubTab={activeSubTab} 
        onSubTabChange={(id) => setActiveSubTab(id)} 
      />

      <div className="flex-1">
        {activeSubTab === 'general' && (
          <div className="space-y-6">
            {/* Search and Filter Area */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                    <input 
                        type="text" 
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        placeholder="Digite a VAGA (Ex: E.1.3), OP, Produto ou Lote..." 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-11 py-3 text-white font-semibold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                    />
                </div>
                
                {/* Type Filter Dropdown */}
                <div className="relative w-full md:w-64">
                  <button
                    onClick={() => setIsInventoryFilterOpen(!isInventoryFilterOpen)}
                    className={`w-full flex items-center justify-between px-5 py-3 bg-slate-900 border ${isInventoryFilterOpen ? 'border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'border-slate-800'} rounded-xl transition-all group`}
                  >
                    <div className="flex items-center gap-3">
                      <Filter className={`w-4 h-4 ${inventoryTypeFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${inventoryTypeFilter !== 'ALL' ? 'text-white' : 'text-slate-500'}`}>
                        {inventoryTypeFilter === 'ALL' ? 'Todos os Tipos' : 
                         inventoryTypeFilter === 'CONTAINER' ? 'Container (SJ/LP/CP)' : 
                         translateSlotContent(inventoryTypeFilter as SlotContent)}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isInventoryFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isInventoryFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsInventoryFilterOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
                          {[
                            { value: 'ALL', label: 'Todos os Tipos' },
                            { value: SlotContent.BOTTLES, label: 'Frasco' },
                            { value: SlotContent.SUPPLIES, label: 'Insumo' },
                            { value: SlotContent.FINISHED_PRODUCT, label: 'Produto Acabado' },
                            { value: 'CONTAINER', label: 'Todos os Containers' },
                            { value: SlotContent.CONTAINER_SJ, label: '• Container Sujo', isSub: true },
                            { value: SlotContent.CONTAINER_LP, label: '• Container Limpo', isSub: true },
                            { value: SlotContent.CONTAINER_CP, label: '• Container com Produto', isSub: true },
                            { value: SlotContent.REWORK, label: 'Retrabalho' },
                            { value: SlotContent.REPROCESS, label: 'Reprocesso' },
                            { value: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo' },
                            { value: SlotContent.RETURN, label: 'Retorno' },
                            { value: SlotContent.MISCELLANEOUS, label: 'Diversos' },
                            { value: SlotContent.DISCARD, label: 'Descarte' },
                            { value: SlotContent.OTHER, label: 'Outro' }
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => {
                                setInventoryTypeFilter(type.value as any);
                                setIsInventoryFilterOpen(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                (type as any).isSub ? 'ml-4 bg-slate-950/30' : ''
                              } ${
                                inventoryTypeFilter === type.value 
                                  ? 'bg-blue-600 text-white' 
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {type.label}
                              {inventoryTypeFilter === type.value && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedPallets.length > 0 && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setIsShipmentModalOpen(true)}
                            className="flex-1 md:flex-none px-5 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-900/20 animate-in zoom-in duration-200"
                        >
                            <Container className="w-3.5 h-3.5" /> Carregamento ({selectedPallets.length})
                        </button>
                        <button 
                            onClick={() => setIsBulkConfirmOpen(true)}
                            className="flex-1 md:flex-none px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 animate-in zoom-in duration-200"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enviar ({selectedPallets.length})
                        </button>
                    </div>
                )}
            </div>

            {filteredInventory.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[32px]">
                        <p className="text-slate-700 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum item encontrado no estoque</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInventory.map(({ row, inspection, idx }) => (
                        <InventoryCard
                            key={`${row.id}::${idx}`}
                            item={row}
                            insp={inspection}
                            idx={idx}
                            isSelected={selectedPallets.includes(`${row.id}::${idx}`)}
                            onToggleSelection={togglePalletSelection}
                            onShowDetail={handleShowDetail}
                            onEdit={handleEditPallet}
                            onDelete={handleDeletePallet}
                            userRole={user?.role}
                        />
                    ))}
                </div>
            )}

            {hasMoreInventory && (
              <div className="flex justify-center pt-8 pb-12">
                <button
                  onClick={loadMoreInventory}
                  disabled={isLoadingMore}
                  className="px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-3 border border-slate-800 shadow-xl"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Carregar Mais Pallets</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'quicksearch' && (
          <div className="max-w-3xl mx-auto">
            <QuickSearch 
              onShowDetail={(pallet) => handleShowDetail(pallet, pallet.inspections[0], 0)}
              onTransfer={(pallet) => {
                setMovementInitialContext({
                  type: 'transfer',
                  id: pallet.loadingId || pallet.id,
                  pallet: pallet
                });
                setIsMovementModalOpen(true);
              }}
              onExit={(pallet) => {
                setMovementInitialContext({
                  type: 'exit',
                  id: pallet.loadingId || pallet.id,
                  pallet: pallet
                });
                setIsMovementModalOpen(true);
              }}
              onAddToShipment={(pallet) => {
                setSelectedPallets([`${pallet.id}::0`]);
                setIsShipmentModalOpen(true);
              }}
            />
          </div>
        )}

        {activeSubTab === 'rotative' && (
          <RotativeStockManager 
            slots={slots}
            onUpdateSlot={onUpdateSlot}
            onShowNotification={showNotification}
            onAddHistory={onAddHistory}
          />
        )}

        {activeSubTab === 'containers' && (
          <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
            <Container className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">
              Visualização de Containers em breve
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
