
import React from 'react';
import { motion } from 'motion/react';

interface Tab {
  id: string;
  label: string;
}

interface SubTabsProps {
  tabs: Tab[];
  activeSubTab: string;
  onSubTabChange: (id: string) => void;
}

export const SubTabs: React.FC<SubTabsProps> = ({ tabs, activeSubTab, onSubTabChange }) => (
  <div className="flex gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/50 mb-8 overflow-x-auto no-scrollbar flex-shrink-0">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onSubTabChange(tab.id)}
        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
          activeSubTab === tab.id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
