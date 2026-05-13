
import React from 'react';
import { AlertCircle, Package, ArrowRight, CornerDownRight, Boxes } from 'lucide-react';

import { ReturnBoxItem, ReturnBoxWithItems } from '../../types/returns';
import { useReturnsStore } from '../../stores/returnsStore';

export const ReturnPendingPanel: React.FC = () => {
  const { boxes } = useReturnsStore();
  const pendingItems: (ReturnBoxItem & { box_code: string })[] = [];
  const openBoxes: ReturnBoxWithItems[] = [];

  boxes.forEach((box: ReturnBoxWithItems) => {
    if (box.status === 'aberta') {
      openBoxes.push(box);
    }
    
    (box.return_box_items || []).forEach((item: ReturnBoxItem) => {
      if (item.lot_pending) {
        pendingItems.push({
          ...item,
          box_code: box.box_code
        });
      }
    });
  });

  const hasPendings = pendingItems.length > 0 || openBoxes.length > 0;

  if (!hasPendings) {
    return (
      <div className="bg-slate-900/40 border-2 border-slate-800 rounded-[2.5rem] p-12 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 rotate-180" />
        </div>
        <h3 className="text-white font-black italic tracking-tight text-xl uppercase mb-2">Tudo em ordem!</h3>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhuma pendência crítica de lotes ou caixas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Pending Lots */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-white font-black italic tracking-tight text-xl uppercase">Lotes Pendentes ({pendingItems.length})</h3>
        </div>
        
        {pendingItems.length === 0 ? (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest uppercase">
            Sem lotes pendentes
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="bg-slate-900 border-2 border-amber-900/30 rounded-3xl p-5 hover:border-amber-400 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-amber-500 font-mono text-[10px] font-bold block">{item.codigo_senior}</span>
                    <h4 className="text-white font-black text-sm uppercase leading-tight">{item.nome}</h4>
                  </div>
                  <div className="bg-slate-800 px-2 py-1 rounded text-[9px] font-black uppercase text-slate-400">
                    QTD: {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[9px] tracking-widest pt-3 border-t border-slate-800">
                  <Package className="w-3 h-3" /> Localizado na: <span className="text-slate-300">{item.box_code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Boxes */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <Boxes className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-black italic tracking-tight text-xl uppercase">Caixas em Aberto ({openBoxes.length})</h3>
        </div>

        {openBoxes.length === 0 ? (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest uppercase">
            Sem caixas abertas
          </div>
        ) : (
          <div className="space-y-3">
            {openBoxes.map((box) => (
              <div key={box.id} className="bg-slate-900 border-2 border-sky-900/30 rounded-3xl p-5 flex justify-between items-center group hover:border-sky-400 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase leading-tight">{box.box_code}</h4>
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest block mt-0.5">
                      {box.return_box_items?.length || 0} ITENS ADICIONADOS
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-800 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
