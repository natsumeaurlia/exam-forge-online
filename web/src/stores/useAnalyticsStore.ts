import { create } from 'zustand';

export type AnalyticsRange = 'all' | '30d' | '7d';

interface AnalyticsState {
  range: AnalyticsRange;
  setRange: (range: AnalyticsRange) => void;
}

export const useAnalyticsStore = create<AnalyticsState>(set => ({
  range: 'all',
  setRange: range => set({ range }),
}));
