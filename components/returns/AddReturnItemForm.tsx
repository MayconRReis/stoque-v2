
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus, AlertCircle, Trash2, Package, Tag, ArrowRight } from 'lucide-react';
import { insumoService, returnBoxItemService } from '../../services/returnService';
import { Insumo } from '../../types/returns';
import { RequestInsumoModal } from './RequestInsumoModal';

interface AddReturnItemFormProps {
  returnId: string;
  boxId: string;
  onAdded: () => void;
}

export const AddReturnItemForm: React.FC<AddReturnItemFormProps> = ({ returnId, boxId, onAdded }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Insumo[]>([]);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [lot, setLot] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await insumoService.searchInsumos({ search: query });
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsumo || !quantity || Number(quantity) <= 0) return;

    setLoading(true);
    try {
      await returnBoxItemService.createItem({
        return_id: returnId,
        box_id: boxId,
        insumo_id: selectedInsumo.id,
        codigo_senior: selectedInsumo.codigo_senior,
        nome: selectedInsumo.descricao_insumo,
        quantity: Number(quantity),
        lot: lot.trim() || undefined
      });
      onAdded();
      // Reset form
      setSelectedInsumo(null);
      setQuantity('');
      setLot('');
      setQuery('');
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!selectedInsumo ? (
        <div className="space-y-4">
          <div className="relative">
            <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-2">
              <Search className="w-3 h-3" /> Buscar Insumo
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="NOME OU CÓDIGO SENIOR DO ITEM..."
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-12 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
              {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-spin" />}
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
              {results.map((insumo) => (
                <button
                  key={insumo.id}
                  onClick={() => setSelectedInsumo(insumo)}
                  className="w-full px-5 py-4 text-left hover:bg-slate-800 transition-colors flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-amber-500 font-mono text-xs font-bold">{insumo.codigo_senior}</span>
                    <span className="text-slate-200 font-black text-sm uppercase group-hover:text-white">{insumo.descricao_insumo}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {query.length >= 3 && !loading && results.length === 0 && (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-800">
              <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-4">Insumo não encontrado no cadastro oficial</p>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 hover:text-black transition-all"
              >
                Solicitar Cadastro de Item
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleAdd} className="space-y-6 animate-in zoom-in-95 duration-200">
          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-5 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-black">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-amber-500 font-mono text-xs font-bold leading-none">{selectedInsumo.codigo_senior}</span>
                <h4 className="text-white font-black text-lg uppercase leading-tight mt-1">{selectedInsumo.descricao_insumo}</h4>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setSelectedInsumo(null)}
              className="text-slate-500 hover:text-rose-500 transition-colors p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                Quantidade
              </label>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-xl placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                Lote <span className="opacity-50">(OPCIONAL)</span>
              </label>
              <input
                type="text"
                placeholder="EX: 123456"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-black uppercase placeholder:text-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={loading || !quantity || Number(quantity) <= 0}
            type="submit"
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Confirmar e Adicionar
          </button>
        </form>
      )}

      {showRequestModal && (
        <RequestInsumoModal 
          initialName={query}
          returnId={returnId}
          boxId={boxId}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            setQuery('');
            onAdded();
          }}
        />
      )}
    </div>
  );
};
