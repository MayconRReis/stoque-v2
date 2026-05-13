
import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Package, Boxes, Loader2, History } from 'lucide-react';
import { returnLogsService } from '../../services/returnService';
import { ReturnLog } from '../../types/returns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReturnLogsTabProps {
  returnId: string;
}

export const ReturnLogsTab: React.FC<ReturnLogsTabProps> = ({ returnId }) => {
  const [logs, setLogs] = useState<ReturnLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await returnLogsService.getLogsByReturn(returnId);
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [returnId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando histórico...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-slate-900/40 border-2 border-slate-800 rounded-[2.5rem] p-20 text-center">
        <History className="w-12 h-12 text-slate-800 mx-auto mb-4" />
        <h3 className="text-white font-black italic tracking-tight text-xl uppercase mb-2">Sem histórico</h3>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhuma ação registrada para este retorno ainda.</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    if (action.includes('item')) return Package;
    if (action.includes('caixa')) return Boxes;
    return FileText;
  };

  const getActionColor = (action: string) => {
    if (action.includes('criado') || action.includes('adicionado')) return 'text-emerald-500';
    if (action.includes('alterado') || action.includes('editado')) return 'text-amber-500';
    if (action.includes('cancelado') || action.includes('removido')) return 'text-rose-500';
    return 'text-sky-500';
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden">
      <div className="p-8 border-b-2 border-slate-800 flex items-center gap-4 bg-slate-800/30">
        <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg shadow-white/5">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-white font-black italic tracking-tight text-xl uppercase">Trilha de Auditoria</h3>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Controle total sobre as operações realizadas</p>
        </div>
      </div>

      <div className="p-8 divide-y divide-slate-800">
        {logs.map((log) => {
          const Icon = getActionIcon(log.action);
          const colorClass = getActionColor(log.action);
          
          return (
            <div key={log.id} className="py-6 first:pt-0 last:pb-0 flex gap-6 items-start">
              <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700 shadow-sm shadow-black/20 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-white font-black text-sm uppercase tracking-tight italic">{log.description}</h4>
                  <span className="text-slate-500 font-mono text-[9px] font-bold">
                    {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-500 font-black uppercase text-[9px] tracking-widest">
                    <User className="w-3 h-3" /> {log.created_by_name || 'Sistema'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg bg-slate-950 font-black uppercase text-[8px] tracking-[0.2em] border border-slate-800 ${colorClass} opacity-80`}>
                    {log.action.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
