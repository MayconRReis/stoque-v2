
import React from 'react';
import { SubTabs } from '../SubTabs';
import { MovementModal } from '../MovementModal';
import { ImportPage } from '../ImportPage';
import { WaitingSlotsView } from '../WaitingSlotsView';
import { AnalysisPage } from '../AnalysisPage';
import { SheetRow, WarehouseSlot, HistoryEntry, SlotContent, InspectionData } from '../../types';

interface OperationsModuleProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  slots: WarehouseSlot[];
  data: SheetRow[];
  history: HistoryEntry[];
  waitingRows: SheetRow[];
  pendingRows: SheetRow[];
  handleMovementEntry: (data: any) => Promise<void>;
  handleMovementTransfer: (data: any) => Promise<void>;
  handleMovementExit: (data: any) => Promise<void>;
  handleImportProcess: (entries: { row: SheetRow; slotId: string }[]) => Promise<void>;
  handleConfirmAnalysis: (rowId: string, slotId: string, finalId: string) => Promise<void>;
  handleRejectAnalysis: (rowId: string) => Promise<void>;
  setEditPalletMode: (mode: 'edit' | 'assign') => void;
  setEditPalletContext: (context: { row: SheetRow; inspection: InspectionData; idx: number } | null) => void;
}

export const OperationsModule: React.FC<OperationsModuleProps> = ({
  activeSubTab,
  setActiveSubTab,
  slots,
  data,
  history,
  waitingRows,
  pendingRows,
  handleMovementEntry,
  handleMovementTransfer,
  handleMovementExit,
  handleImportProcess,
  handleConfirmAnalysis,
  handleRejectAnalysis,
  setEditPalletMode,
  setEditPalletContext
}) => {
  const operationsTabs = [
    { id: 'entry', label: 'Entrada' },
    { id: 'exit', label: 'Saída' },
    { id: 'transfer', label: 'Transferência' },
    { id: 'waiting', label: 'Aguardando Vaga' },
    { id: 'import', label: 'Importação' },
    { id: 'analysis', label: 'Análise' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <SubTabs 
        tabs={operationsTabs} 
        activeSubTab={activeSubTab} 
        onSubTabChange={(id) => setActiveSubTab(id)} 
      />
      
      <div className="flex-1">
        {(activeSubTab === 'entry' || activeSubTab === 'exit' || activeSubTab === 'transfer') && (
          <div className="max-w-4xl mx-auto">
            <MovementModal 
              isOpen={true}
              isFlat={true}
              onClose={() => {}}
              onEntry={handleMovementEntry}
              onTransfer={handleMovementTransfer}
              onExit={handleMovementExit}
              availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
              occupiedSlots={slots.filter(s => s.status !== SlotContent.EMPTY)}
              allSlots={slots}
              inventoryData={data}
              history={history}
              initialType={activeSubTab as any}
            />
          </div>
        )}

        {activeSubTab === 'import' && (
          <ImportPage 
            onProcess={handleImportProcess} 
            availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
          />
        )}

        {activeSubTab === 'waiting' && (
          <WaitingSlotsView 
            items={waitingRows}
            onAssignSlot={(row, idx) => {
              setEditPalletMode('assign');
              setEditPalletContext({ row, inspection: row.inspections![idx], idx });
            }}
          />
        )}

        {activeSubTab === 'analysis' && (
          <AnalysisPage 
            pendingItems={pendingRows}
            availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
            allSlots={slots}
            onConfirm={handleConfirmAnalysis}
            onReject={handleRejectAnalysis}
            onEdit={(item) => {
              setEditPalletMode('edit');
              setEditPalletContext({ row: item, inspection: item.inspections?.[0] || { contentType: SlotContent.SUPPLIES, bottles: 0, caps: 0, boxes: 0, cradles: 0 }, idx: 0 });
            }}
          />
        )}
      </div>
    </div>
  );
};
