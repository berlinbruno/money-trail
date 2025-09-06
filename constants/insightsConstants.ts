/**
 * Constants for chart visualizations and insights display
 */

import { Dimensions } from 'react-native';

// Range options for data aggregation
export const RANGE_OPTIONS = ['Weekly', 'Monthly', 'Yearly'] as const;

// Data segments for visualizations
export const SEGMENTS = ['Income', 'Expense', 'Saving'] as const;

// Color scheme for bar charts
export const BAR_COLORS = {
  income: '#007AFF',
  expense: '#FF3B30',
  saving: '#34C759',
};

// Color scheme for trend lines
export const TREND_COLORS = {
  income: '#007AFF',
  expense: '#FF3B30',
  saving: '#34C759',
  prevIncome: '#8a56ce',
  prevExpense: '#56acce',
  prevSaving: '#FF9500',
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
