import { create } from 'zustand';
import { GlobalFilterParams } from '../types';

interface FilterState {
  filters: GlobalFilterParams;
  setFilter: <K extends keyof GlobalFilterParams>(key: K, value: GlobalFilterParams[K]) => void;
  setFilters: (filters: Partial<GlobalFilterParams>) => void;
  resetFilters: () => void;
}

const initialFilters: GlobalFilterParams = {
  searchTerm: '',
  fromDate: '',
  toDate: '',
  projectId: 'ALL',
  assigneeId: 'ALL',
  departmentId: 'ALL',
  status: 'ALL',
  priority: 'ALL',
  taskType: 'ALL',
  onlyOverdue: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: initialFilters,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),
}));
