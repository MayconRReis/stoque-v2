
import React, { useState } from 'react';
import { X, Plus, User, MapPin, FileText, Loader2 } from 'lucide-react';
import { returnsService } from '../../services/returnsService';

interface CreateReturnModalProps {
  onClose: () => void;
  onCreated: (returnId: string) => void;
}

export const CreateReturnModal: React.FC<CreateReturnModalProps> = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    responsible_name: '',
    origin_sector: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.responsible_name || !formData.origin_sector) return;

    setLoading(true);
    try {
      const newReturn = await returnsService.createReturn({
        responsible_name: formData.responsible_name,
        origin_sector: formData.origin_sector,
        notes: formData.notes
      });
      onCreated(newReturn.id);
    } catch (error) {
      console.error('Error creating return:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b-2 border-slate-900 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-white font-black italic tracking-tight text-3xl uppercase">Novo Retorno</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Inicie uma nova montagem de pallet</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Responsável
              </label>
              <input
                required
                type="text"
                placeholder="NOME DO OPERADOR"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Setor de Origem
              </label>
              <input
                required
                type="text"
                placeholder="EX: PRODUÇÃO, ALMOXARIFADO"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={formData.origin_sector}
                onChange={(e) => setFormData({ ...formData, origin_sector: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Observações
              </label>
              <textarea
                rows={3}
                placeholder="NOTAS ADICIONAIS SOBRE O RETORNO"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !formData.responsible_name || !formData.origin_sector}
              type="submit"
              className="flex-[2] bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Criar Retorno
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
