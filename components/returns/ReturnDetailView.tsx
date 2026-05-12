
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ArrowLeft, Boxes, AlertCircle, FileText, Plus, ChevronRight, CornerDownRight, User, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { returnsService } from '../../services/returnsService';
import { Return, ReturnBox, ReturnStatus, BoxStatus } from '../../types/returns';
import { ReturnBoxesTab } from './ReturnBoxesTab';
import { ReturnPendingPanel } from './ReturnPendingPanel';
import { ReturnLogsTab } from './ReturnLogsTab';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReturnDetailViewProps {
  returnId: string;
  onBack: () => void;
}

export const ReturnDetailView: React.FC<ReturnDetailViewProps> = ({ returnId, onBack }) => {
  const [returnItem, setReturnItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'caixas' | 'pendencias' | 'logs'>('caixas');

  const fetchReturnData = useCallback(async () => {
    try {
      const data = await returnsService.getReturnById(returnId);
      setReturnItem(data);
    } catch (error) {
      console.error('Error fetching return detail:', error);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    fetchReturnData();
  }, [fetchReturnData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white font-black uppercase tracking-widest text-xs">Carregando detalhes...</p>
      </div>
    );
  }

  if (!returnItem) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-white font-black italic tracking-tight text-xl uppercase mb-2">Retorno não encontrado</h3>
        <button onClick={onBack} className="text-amber-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
      </div>
    );
  }

  const boxCount = returnItem.return_boxes?.length || 0;
  const itemCount = returnItem.return_boxes?.reduce((acc: number, box: any) => acc + (box.return_box_items?.length || 0), 0) || 0;
  const pendingLots = returnItem.return_boxes?.reduce((acc: number, box: any) => {
    return acc + (box.return_box_items?.filter((item: any) => item.lot_pending)?.length || 0);
  }, 0) || 0;

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case ReturnStatus.EM_MONTAGEM: return 'text-amber-400';
      case ReturnStatus.CONFERIDO: return 'text-emerald-400';
      case ReturnStatus.FINALIZADO: return 'text-slate-400';
      case ReturnStatus.CANCELADO: return 'text-rose-400';
      default: return 'text-blue-400';
    }
  };

  const tabs = [
    { id: 'caixas', label: 'Caixas', icon: Boxes, count: boxCount },
    { id: 'pendencias', label: 'Pendências', icon: AlertCircle, count: pendingLots, highlight: pendingLots > 0 },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b-2 border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="bg-slate-800 text-white p-4 rounded-2xl hover:bg-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Package className="w-5 h-5 text-slate-400" />
                <h1 className="text-white font-black italic tracking-tight text-4xl uppercase">{returnItem.return_code}</h1>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(returnItem.created_at), 'dd MMM yyyy HH:mm', { locale: ptBR })}</span>
                <span className={`flex items-center gap-1.5 ${getStatusColor(returnItem.status)}`}><CheckCircle2 className="w-3 h-3" /> {returnItem.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <div className="bg-slate-950/50 border-2 border-slate-900 px-4 py-3 rounded-2xl">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-1">Caixas</span>
              <span className="text-white font-black text-xl italic">{boxCount}</span>
            </div>
            <div className="bg-slate-950/50 border-2 border-slate-900 px-4 py-3 rounded-2xl">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-1">Itens</span>
              <span className="text-white font-black text-xl italic">{itemCount}</span>
            </div>
            <div className={`bg-slate-950/50 border-2 border-slate-900 px-4 py-3 rounded-2xl ${pendingLots > 0 ? 'border-amber-900/30' : ''}`}>
              <span className={`${pendingLots > 0 ? 'text-amber-500' : 'text-slate-600'} font-black uppercase text-[8px] tracking-[0.2em] block mb-1`}>Lotes Pend.</span>
              <span className={`${pendingLots > 0 ? 'text-amber-400' : 'text-white'} font-black text-xl italic`}>{pendingLots}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-900/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8px] tracking-widest block">Responsável</span>
              <span className="text-slate-200 font-bold text-sm uppercase">{returnItem.responsible_name || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8px] tracking-widest block">Setor de Origem</span>
              <span className="text-slate-200 font-bold text-sm uppercase">{returnItem.origin_sector || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-[1] flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all
                ${isActive 
                  ? 'bg-white text-black shadow-lg shadow-white/5' 
                  : 'bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 border-2 border-slate-800'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-black' : ''} ${tab.highlight && !isActive ? 'text-amber-500' : ''}`} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${isActive ? 'bg-black text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'caixas' && (
          <ReturnBoxesTab 
            returnId={returnId} 
            boxes={returnItem.return_boxes || []} 
            onRefresh={fetchReturnData} 
          />
        )}
        {activeTab === 'pendencias' && (
          <ReturnPendingPanel 
            returnId={returnId} 
            boxes={returnItem.return_boxes || []} 
          />
        )}
        {activeTab === 'logs' && (
          <ReturnLogsTab 
            returnId={returnId} 
          />
        )}
      </div>
    </div>
  );
};
