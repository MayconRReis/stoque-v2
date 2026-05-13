
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Search, Filter, Loader2, Package, Inbox, ChevronRight } from 'lucide-react';
import { SubTabs } from '../SubTabs';
import { returnService } from '../../services/returnService';
import { Return, ReturnStatus } from '../../types/returns';
import { ReturnCard } from '../returns/ReturnCard';
import { CreateReturnModal } from '../returns/CreateReturnModal';
import { ReturnDetailView } from '../returns/ReturnDetailView';

interface ReturnsModuleProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  user?: import('../../types').User | null;
}

export const ReturnsModule: React.FC<ReturnsModuleProps> = ({
  activeSubTab,
  setActiveSubTab,
  user
}) => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await returnService.listReturns({ 
        search: search || undefined, 
        status: (statusFilter as any) || undefined 
      });

      setReturns(response.data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const returnsTabs = [
    { id: 'open', label: 'Monitor de Retornos' },
    { id: 'requests', label: 'Solicitações de Items' },
  ];

  if (selectedReturnId) {
    return (
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
        <ReturnDetailView 
          returnId={selectedReturnId} 
          onBack={() => {
            setSelectedReturnId(null);
            fetchReturns();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <SubTabs 
        tabs={returnsTabs} 
        activeSubTab={activeSubTab} 
        onSubTabChange={(id) => setActiveSubTab(id)} 
      />
      
      <div className="flex-1 space-y-8">
        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-stretch md:items-center">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="BUSCAR POR CÓDIGO OU RESPONSÁVEL..."
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-12 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
            </div>
            <select
              className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white font-black uppercase focus:border-amber-400 focus:outline-none appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">TODOS STATUS</option>
              {Object.values(ReturnStatus).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Novo Retorno
          </button>
        </div>

        {/* Returns Grid */}
        {loading && returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Consultando base de dados...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/10">
            <Inbox className="w-16 h-16 text-slate-800 mx-auto mb-4" />
            <h3 className="text-white font-black italic tracking-tight text-2xl uppercase mb-2">Nenhum retorno encontrado</h3>
            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em] mb-8">
              Ajuste os filtros ou crie um novo retorno para começar
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-amber-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors"
            >
              + CRIAR PRIMEIRO RETORNO AGORA
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {returns.map((ret) => (
              <ReturnCard 
                key={ret.id} 
                returnItem={ret} 
                onOpen={(id) => setSelectedReturnId(id)} 
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateReturnModal 
          onClose={() => setShowCreateModal(false)}
          currentUser={user} 
          onCreated={(id) => {
            setShowCreateModal(false);
            setSelectedReturnId(id);
          }}
        />
      )}
    </div>
  );
};
