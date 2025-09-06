/**
 * Constants for chart visualizations and insights display
 */

import { Dimensions } from 'react-native';

// Range options for data aggregation
export const RANGE_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

// Data segments for visualizations
export const SEGMENTS = ['Income', 'Expense', 'Saving'] as const;

// Color scheme for charts
export const TREND_COLORS = {
  income: '#34C759',
  expense: '#FF3B30',
  saving: '#007AFF',
  prevIncome: '#FF9500',
  prevExpense: '#56acce',
  prevSaving: '#8a56ce',
};

// Labels for trend legends
export const TREND_LABELS = [
  'Income',
  'Expense',
  'Saving',
  'Prev Income',
  'Prev Expense',
  'Prev Saving',
];

// Bar chart visualization constants
export const BAR_WIDTH = 15;
export const BAR_SPACING = 20;

// Chart division constants
export const NO_OF_SECTIONS = 5;
export const ANIMATION_DURATION = 800;

// Screen dimensions for responsive layouts
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const PIE_RADIUS = SCREEN_WIDTH / 3.5; // Dynamic radius based on screen width
