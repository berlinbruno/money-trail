// types/FilterState.ts
export type FilterState = {
  startDate: Date | null;
  endDate: Date | null;
  selectedPreset: string;
  search: string;
  type: 'all' | 'credit' | 'debit';
  category: string;
  showStartPicker: boolean;
  showEndPicker: boolean;
};
