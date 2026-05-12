
import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { SubTabs } from '../SubTabs';
import { UserManager } from '../UserManager';
import ApprovalsPage from '../ApprovalsPage';
import { User as AppUser } from '../../types';

interface AdminModuleProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  user: AppUser | null;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  activeSubTab,
  setActiveSubTab,
  user
}) => {
  const administrationTabs = [
    { id: 'users', label: 'Usuários' },
    { id: 'approvals', label: 'Aprovações' },
    { id: 'registrations', label: 'Cadastros' },
    { id: 'settings', label: 'Configurações' }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Acesso Restrito</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <SubTabs 
        tabs={administrationTabs} 
        activeSubTab={activeSubTab} 
        onSubTabChange={(id) => setActiveSubTab(id)} 
      />
      
      <div className="flex-1">
        {activeSubTab === 'users' && <UserManager />}
        {activeSubTab === 'approvals' && <ApprovalsPage currentUser={user} />}
        {activeSubTab === 'registrations' && (
          <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
            <Plus className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">
              Módulo de Cadastros em breve
            </p>
          </div>
        )}
        {activeSubTab === 'settings' && (
          <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
            <Settings className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">
              Configurações do Sistema em breve
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
