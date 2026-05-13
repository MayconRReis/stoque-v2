
import React, { useState } from 'react';
import { X, Plus, User, MapPin, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { returnService, returnBoxService, returnLogsService } from '../../services/returnService';
import type { User as AppUser } from '../../types';

interface CreateReturnModalProps {
  onClose: () => void;
  onCreated: (newReturn: any) => void;
  currentUser?: AppUser | null;
}

export const CreateReturnModal: React.FC<CreateReturnModalProps> = ({ onClose, onCreated, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    responsible_name: '',
    origin_sector: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const responsibleName = formData.responsible_name.trim();
    const originSector = formData.origin_sector.trim();
    const notes = formData.notes.trim();

    if (!responsibleName || !originSector) {
      setErrorMsg('Preencha os campos obrigatórios corretamente.');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar Retorno
      const newReturn = await returnService.createReturn({
        responsible_name: responsibleName,
        origin_sector: originSector,
        notes: notes || undefined,
        created_by: currentUser?.id
      });

      // 2. Criar Primeira Caixa (CX01)
      const firstBox = await returnBoxService.createBox({
        return_id: newReturn.id,
        created_by: currentUser?.id
      });

      // 3. Registrar Log de Auditoria
      await returnLogsService.addLog({
        return_id: newReturn.id,
        box_id: firstBox.id,
        action: 'criado',
        description: 'Retorno e primeira caixa (CX01) criados',
        created_by: currentUser?.id,
        created_by_name: currentUser?.name || responsibleName
      });

      setSuccessMsg('Retorno criado com sucesso! Abrindo detalhes...');
      
      // Mostrar feedback visual por um breve momento antes de fechar
      setTimeout(() => {
        onCreated(newReturn);
      }, 800);
      
    } catch (error: any) {
      console.error('Error creating return:', error);
      setErrorMsg(error?.message || 'Ocorreu um erro ao tentar criar o retorno.');
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
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {errorMsg && (
            <div className="flex items-center gap-3 bg-rose-500/10 text-rose-400 p-4 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold uppercase">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold uppercase">{successMsg}</p>
            </div>
          )}

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
                disabled={loading || !!successMsg}
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
                disabled={loading || !!successMsg}
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
                disabled={loading || !!successMsg}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || !!successMsg}
              className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !formData.responsible_name.trim() || !formData.origin_sector.trim() || !!successMsg}
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
