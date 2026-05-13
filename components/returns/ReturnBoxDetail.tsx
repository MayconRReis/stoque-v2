
import React, { useState } from 'react';
import { Package, ArrowLeft, Boxes, Plus, Search, Tag, AlertCircle, Trash2, CheckCircle2, MapPin, Layers } from 'lucide-react';
import { ReturnBox, ReturnBoxItem, ReturnBoxStatus } from '../../types/returns';
import { returnBoxService } from '../../services/returnService';
import { AddReturnItemForm } from './AddReturnItemForm';

interface ReturnBoxDetailProps {
  box: any;
  onBack: () => void;
}

export const ReturnBoxDetail: React.FC<ReturnBoxDetailProps> = ({ box, onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const getStatusColor = (status: ReturnBoxStatus) => {
    switch (status) {
      case ReturnBoxStatus.ABERTA: return 'text-sky-400';
      case ReturnBoxStatus.CONFERIDA: return 'text-emerald-400';
      case ReturnBoxStatus.ETIQUETADA: return 'text-amber-400';
      case ReturnBoxStatus.CANCELADA: return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const items = box.return_box_items || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Box Header */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b-2 border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-white font-black italic tracking-tight text-2xl uppercase">{box.box_code}</h3>
                <div className={`px-2 py-0.5 rounded-lg bg-slate-950 font-black uppercase text-[8px] tracking-[0.2em] ${getStatusColor(box.status)} border border-slate-800`}>
                  {box.status}
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Posição {box.pallet_order}</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {items.length} itens</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`${showAddForm ? 'bg-slate-800 text-white' : 'bg-white text-black'} px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2`}
          >
            {showAddForm ? 'Fechar Cadastro' : <><Plus className="w-4 h-4" /> Adicionar Item</>}
          </button>
        </div>

        {showAddForm && (
          <div className="p-8 border-b-2 border-slate-800 bg-slate-950/40">
            <AddReturnItemForm 
              returnId={box.return_id} 
              boxId={box.id} 
              onAdded={() => {
                setShowAddForm(false);
                onBack(); // Simplest way to refresh is go back and open again, or we'd need better state
              }} 
            />
          </div>
        )}

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">Cód. Senior</th>
                <th className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">Descrição</th>
                <th className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">Qtd</th>
                <th className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">Lote</th>
                <th className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest italic tracking-tight">
                    Caixa sem itens. Comece adicionando o primeiro insumo.
                  </td>
                </tr>
              ) : (
                items.map((item: ReturnBoxItem) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-amber-500 font-mono text-xs font-bold">{item.codigo_senior}</td>
                    <td className="px-6 py-4 text-slate-200 font-bold text-sm uppercase">{item.nome}</td>
                    <td className="px-6 py-4 text-white font-black">{item.quantity}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {item.lot ? (
                        <span className="text-slate-400">{item.lot}</span>
                      ) : (
                        <span className="text-amber-500 font-black italic tracking-tight uppercase">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {item.lot_pending ? (
                          <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center" title="Lote Pendente">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center" title="Completo">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
