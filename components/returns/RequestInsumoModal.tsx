
import React, { useState } from 'react';
import { X, Send, AlertCircle, FileText, Loader2, Info } from 'lucide-react';
import { returnItemRequestService } from '../../services/returnService';

interface RequestInsumoModalProps {
  initialName: string;
  returnId?: string;
  boxId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestInsumoModal: React.FC<RequestInsumoModalProps> = ({ 
  initialName, 
  returnId, 
  boxId, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requested_name: initialName,
    requested_description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requested_name) return;

    setLoading(true);
    try {
      await returnItemRequestService.createRequest({
        requested_name: formData.requested_name,
        requested_description: formData.requested_description,
        return_id: returnId,
        box_id: boxId
      });
      onSuccess();
    } catch (error) {
      console.error('Error requesting insumo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b-2 border-slate-900 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-white font-black italic tracking-tight text-3xl uppercase">Solicitar Item</h2>
            <p className="text-amber-500 font-bold uppercase text-[10px] tracking-[0.2em]">Item não encontrado no catálogo oficial</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 pt-8">
          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-4 flex gap-4">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase">
              SE O ITEM NÃO APARECE NA BUSCA, ELE PODE SER NOVO OU ESTAR DESATIVADO. 
              ESTA SOLICITAÇÃO SERÁ ENVIADA PARA O ADMIN CADASTRAR O <span className="text-white">CÓDIGO SENIOR</span> CORRETO.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                Nome do Insumo
              </label>
              <input
                required
                type="text"
                placeholder="NOME COMPLETO DO MATERIAL"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={formData.requested_name}
                onChange={(e) => setFormData({ ...formData, requested_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                Observações/Referência
              </label>
              <textarea
                rows={3}
                placeholder="ADICIONE INFORMAÇÕES QUE AJUDEM A LOCALIZAR ESTE ITEM NO ERP SENIOR"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all resize-none"
                value={formData.requested_description}
                onChange={(e) => setFormData({ ...formData, requested_description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !formData.requested_name}
              type="submit"
              className="flex-[2] bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Solicitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
