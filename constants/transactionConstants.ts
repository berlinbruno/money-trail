import { TransactionCategory } from '@/types/Transaction';

export const DEBIT_CATEGORIES = [
  'food',
  'grocery',
  'bills',
  'shopping',
  'travel',
  'fuel',
  'rent',
  'healthcare',
  'education',
  'entertainment',
  'utilities',
  'insurance',
  'fitness',
  'beauty',
  'transport',
  'subscription',
  'donation',
  'maintenance',
  'other',
] as const;

export const CREDIT_CATEGORIES = [
  'salary',
  'investments',
  'refund',
  'bonus',
  'freelance',
  'gift',
  'cashback',
  'dividend',
  'interest',
  'commission',
  'rental',
  'other',
] as const;

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
  healthcare: '#FF6B9D', // pink
  education: '#4ECDC4', // turquoise
  entertainment: '#A8E6CF', // light green
  utilities: '#FFB347', // peach
  insurance: '#DDA0DD', // plum
  fitness: '#98FB98', // pale green
  beauty: '#F0E68C', // khaki
  transport: '#87CEEB', // sky blue
  subscription: '#D2B48C', // tan
  donation: '#F5DEB3', // wheat
  maintenance: '#CD853F', // peru
  // Credit
  salary: '#20C997', // teal
  investments: '#15AABF', // cyan
  refund: '#F783AC', // pink
  bonus: '#32CD32', // lime green
  freelance: '#40E0D0', // turquoise
  gift: '#DA70D6', // orchid
  cashback: '#FFA500', // orange
  dividend: '#9370DB', // medium purple
  interest: '#20B2AA', // light sea green
  commission: '#FF7F50', // coral
  rental: '#6495ED', // cornflower blue
  other: '#868E96', // dark grey
};

export const TRANSACTION_TYPE = ['credit', 'debit'] as const;

export const TRANSACTION_MODES = ['upi', 'neft', 'imps', 'card', 'cash', 'other'] as const;

export const TRANSACTION_SOURCES = ['manual', 'sms', 'api'] as const;
