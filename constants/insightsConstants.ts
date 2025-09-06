import { Dimensions } from 'react-native';
export const RANGE_OPTIONS = ['Weekly', 'Monthly', 'Yearly'] as const;
export const SEGMENTS = ['Income', 'Expense', 'Saving'] as const;
export const BAR_COLORS = {
  income: '#007AFF',
  expense: '#FF3B30',
  saving: '#34C759',
};
export const TREND_COLORS = {
  income: '#007AFF',
  expense: '#FF3B30',
  saving: '#34C759',
  prevIncome: '#8a56ce',
  prevExpense: '#56acce',
  prevSaving: '#FF9500',
};
//hi
export const TREND_LABELS = [
  'Income',
  'Expense',
  'Saving',
  'Prev Income',
  'Prev Expense',
  'Prev Saving',
];
export const BAR_WIDTH = 15;
export const BAR_SPACING = 20;
export const NO_OF_SECTIONS = 5;
export const ANIMATION_DURATION = 800;
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const PIE_RADIUS = SCREEN_WIDTH / 6.2;
