import { TransactionCategory } from '@/types/Transaction';

export const DEBIT_CATEGORIES = [
  'food',
  'grocery',
  'bills',
  'shopping',
  'travel',
  'fuel',
  'rent',
  'other',
] as const;

export const CREDIT_CATEGORIES = ['salary', 'investments', 'refund', 'other'] as const;

export const TRANSACTION_CATEGORIES = {
  credit: CREDIT_CATEGORIES,
  debit: DEBIT_CATEGORIES,
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  // Debit
  food: '#FF6B6B', // red-ish
  grocery: '#FFA94D', // orange
  bills: '#FFD43B', // yellow
  shopping: '#6BCB77', // green
  travel: '#4D96FF', // blue
  fuel: '#845EC2', // purple
  rent: '#FF9671', // salmon
  salary: '#20C997', // teal
  investments: '#15AABF', // cyan
  refund: '#F783AC', // pink
  other: '#868E96', // dark grey
};

export const TRANSACTION_TYPE = ['credit', 'debit'] as const;

export const TRANSACTION_MODES = ['upi', 'neft', 'imps', 'card', 'cash', 'other'] as const;

export const TRANSACTION_SOURCES = ['manual', 'sms', 'api'] as const;
