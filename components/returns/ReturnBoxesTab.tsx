
import React, { useState } from 'react';
import { Boxes, Plus, ArrowUp, AlertCircle, ArrowRight, Loader2, Package } from 'lucide-react';
import { ReturnBox, ReturnBoxStatus } from '../../types/returns';
import { returnBoxService, returnService } from '../../services/returnService';
import { ReturnBoxDetail } from './ReturnBoxDetail';

import { useReturnsStore } from '../../stores/returnsStore';

export const ReturnBoxesTab: React.FC = () => {
  const { selectedReturn, boxes, setSelectedBox, selectedBox, setSelectedReturn, setBoxes } = useReturnsStore();
  const [loading, setLoading] = useState(false);

  const returnId = selectedReturn?.id;

  const handleRefresh = async () => {
    if (!returnId) return;
    try {
      const data = await returnService.getReturnFull(returnId);
      setSelectedReturn(data);
      setBoxes(data?.return_boxes || []);
    } catch (error) {
      console.error('Error refreshing return detail:', error);
    }
  };

  const handleAddBox = async () => {
    if (!returnId) return;
    setLoading(true);
    try {
      await returnBoxService.createBox({ return_id: returnId });
      handleRefresh();
    } catch (error) {
      console.error('Error adding box:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: ReturnBoxStatus) => {
    switch (status) {
      case ReturnBoxStatus.ABERTA: return { color: 'text-sky-400', bg: 'bg-sky-400/10', label: 'Aberta' };
      case ReturnBoxStatus.ETIQUETADA: return { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Etiquetada' };
      case ReturnBoxStatus.CONFERIDA: return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Conferida' };
      case ReturnBoxStatus.CANCELADA: return { color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Cancelada' };
      default: return { color: 'text-slate-400', bg: 'bg-slate-400/10', label: status };
    }
  };

  if (selectedBox) {
    return <ReturnBoxDetail />;
  }

  // Sort boxes by pallet_order descending to show the top-most box first (operacional)
  const sortedBoxes = [...boxes].sort((a, b) => b.pallet_order - a.pallet_order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-[2rem] border-2 border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-black italic tracking-tight text-xl uppercase">Gestão de Caixas</h3>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Adicione e organize itens no pallet</p>
          </div>
        </div>
        <button
          onClick={handleAddBox}
          disabled={loading}
          className="bg-white text-black px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar Caixa
        </button>
      </div>

      {sortedBoxes.length === 0 ? (
        <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 text-center">
          <Boxes className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <p className="text-slate-600 font-black uppercase text-sm tracking-widest italic tracking-tight uppercase">Nenhuma caixa adicionada</p>
          <button onClick={handleAddBox} className="mt-4 text-amber-500 font-bold uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors">
            CRIAR PRIMEIRA CAIXA AGORA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBoxes.map((box) => {
            const statusStyle = getStatusDisplay(box.status);
            const itemsCount = box.return_box_items?.length || 0;
            const pendingItems = box.return_box_items?.filter((i: any) => i.lot_pending)?.length || 0;

            return (
              <div 
                key={box.id}
                className="bg-slate-900 border-2 border-slate-800 rounded-[2rem] p-6 hover:border-slate-600 transition-all group overflow-hidden relative"
              >
                {/* Pallet Marker */}
                <div className="absolute right-0 top-0 bg-slate-800/50 py-2 px-4 rounded-bl-2xl flex items-center gap-2 border-l border-b border-slate-700">
                  <ArrowUp className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">NÍVEL {box.pallet_order}</span>
                </div>

                <div className="mb-6 pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-white font-black italic tracking-tight text-xl uppercase">
                      {box.box_code}
                    </span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.color} text-[10px] font-black uppercase tracking-widest`}>
                    {statusStyle.label}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Itens na caixa</span>
                    <span className="text-white font-black">{itemsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Lotes pendentes</span>
                    <span className={`${pendingItems > 0 ? 'text-amber-500' : 'text-slate-500'} font-black`}>{pendingItems}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBox(box as any)}
                  className="w-full bg-slate-800 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest group-hover:bg-amber-400 group-hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  Abrir Caixa
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
