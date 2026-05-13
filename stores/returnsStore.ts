import { create } from 'zustand';
import type { 
  ReturnSummary, 
  ReturnFull, 
  ReturnBoxWithItems, 
  ReturnFilters,
  ReturnLog,
  ReturnPendingInfo,
  ReturnBoxItem
} from '../types/returns';

interface ReturnsState {
  // Dados principais
  returns: ReturnSummary[];
  selectedReturn: ReturnFull | null;
  boxes: ReturnBoxWithItems[];
  selectedBox: ReturnBoxWithItems | null;
  pendingItems: ReturnPendingInfo[];
  logs: ReturnLog[];
  
  // Controle de estado
  loading: boolean;
  error: string | null;
  
  // Filtros e busca
  filters: ReturnFilters;
  search: string;
  
  // Paginação
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  
  // Actions
  setReturns: (returns: ReturnSummary[]) => void;
  setSelectedReturn: (ret: ReturnFull | null) => void;
  setBoxes: (boxes: ReturnBoxWithItems[]) => void;
  setSelectedBox: (box: ReturnBoxWithItems | null) => void;
  setPendingItems: (items: ReturnPendingInfo[]) => void;
  setLogs: (logs: ReturnLog[]) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ReturnFilters>) => void;
  setSearch: (search: string) => void;
  setPagination: (pagination: Partial<ReturnsState['pagination']>) => void;
  
  resetReturnsState: () => void;
}

const initialState = {
  returns: [],
  selectedReturn: null,
  boxes: [],
  selectedBox: null,
  pendingItems: [],
  logs: [],
  
  loading: false,
  error: null,
  
  filters: {},
  search: '',
  
  pagination: {
    page: 0,
    pageSize: 50,
    total: 0,
    hasMore: false,
  }
};

export const useReturnsStore = create<ReturnsState>((set) => ({
  ...initialState,
  
  setReturns: (returns) => set({ returns }),
  setSelectedReturn: (selectedReturn) => set({ selectedReturn }),
  setBoxes: (boxes) => set({ boxes }),
  setSelectedBox: (selectedBox) => set({ selectedBox }),
  setPendingItems: (pendingItems) => set({ pendingItems }),
  setLogs: (logs) => set({ logs }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSearch: (search) => set({ search }),
  setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  
  resetReturnsState: () => set(initialState),
}));
