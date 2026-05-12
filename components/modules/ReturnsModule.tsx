
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SubTabs } from '../SubTabs';

interface ReturnsModuleProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export const ReturnsModule: React.FC<ReturnsModuleProps> = ({
  activeSubTab,
  setActiveSubTab
}) => {
  const returnsTabs = [
    { id: 'open', label: 'Retornos Abertos' },
    { id: 'create', label: 'Criar Retorno' },
    { id: 'boxes', label: 'Caixas' },
    { id: 'items', label: 'Itens' },
    { id: 'pending', label: 'Lotes Pendentes' },
    { id: 'labels', label: 'Etiquetas' },
    { id: 'finalize', label: 'Finalização' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <SubTabs 
        tabs={returnsTabs} 
        activeSubTab={activeSubTab} 
        onSubTabChange={(id) => setActiveSubTab(id)} 
      />
      
      <div className="flex-1">
        <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
          <RefreshCw className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h3 className="text-white font-black uppercase text-xl italic tracking-tight mb-2">Módulo de Retornos</h3>
          <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">
            Em desenvolvimento para Stoque+
          </p>
        </div>
      </div>
    </div>
  );
};
