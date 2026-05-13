
import React from 'react';
import { Package, User, MapPin, Calendar, Boxes, CheckCircle2, AlertCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { ReturnSummary, ReturnStatus } from '../../types/returns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReturnCardProps {
  returnItem: ReturnSummary;
  onOpen: (id: string) => void;
}

export const ReturnCard: React.FC<ReturnCardProps> = ({ returnItem, onOpen }) => {
  const getStatusConfig = (status: ReturnStatus) => {
    switch (status) {
      case ReturnStatus.EM_MONTAGEM:
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Em Montagem' };
      case ReturnStatus.AGUARDANDO_LOTE:
        return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Aguardando Lote' };
      case ReturnStatus.AGUARDANDO_CONFERENCIA:
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Aguardando Conferência' };
      case ReturnStatus.CONFERIDO:
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Conferido' };
      case ReturnStatus.FINALIZADO:
        return { icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Finalizado' };
      case ReturnStatus.CANCELADO:
        return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Cancelado' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10', label: status };
    }
  };

  const statusConfig = getStatusConfig(returnItem.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className="bg-slate-900 border-2 border-slate-800 rounded-[2rem] p-6 hover:border-slate-700 transition-all group relative overflow-hidden"
      id={`return-card-${returnItem.id}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-white font-black italic tracking-tight text-xl uppercase">
              {returnItem.return_code}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} text-[10px] font-black uppercase tracking-widest`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </div>
        </div>
        <button 
          onClick={() => onOpen(returnItem.id)}
          className="bg-white text-black p-3 rounded-2xl hover:scale-110 transition-transform active:scale-95 group-hover:bg-amber-400"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1">
            <User className="w-3 h-3" /> Responsável
          </span>
          <span className="text-slate-200 font-bold text-sm truncate uppercase">
            {returnItem.responsible_name || 'Não informado'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Origem
          </span>
          <span className="text-slate-200 font-bold text-sm truncate uppercase">
            {returnItem.origin_sector || 'Não informado'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t-2 border-slate-800/50">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-slate-500 font-bold uppercase text-[8px] tracking-widest">Caixas</span>
            <span className="text-white font-black text-lg">{returnItem.box_count || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 font-bold uppercase text-[8px] tracking-widest">Itens</span>
            <span className="text-white font-black text-lg">{returnItem.item_count || 0}</span>
          </div>
          {returnItem.pending_lots_count && returnItem.pending_lots_count > 0 ? (
            <div className="flex flex-col">
              <span className="text-amber-500 font-bold uppercase text-[8px] tracking-widest">Lotes Pend.</span>
              <span className="text-amber-500 font-black text-lg">{returnItem.pending_lots_count}</span>
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <span className="text-slate-500 font-bold uppercase text-[8px] tracking-widest block">Criação</span>
          <span className="text-slate-300 font-bold text-[10px] uppercase">
            {format(new Date(returnItem.created_at), 'dd MMM yy HH:mm', { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
};
