import { AlertFrequency, AlertType } from '@/types/Alert';
import { TransactionCategory, TransactionMode, TransactionType } from '@/types/Transaction';

// Transaction types for test data generation
export const TRANSACTION_TYPES: TransactionType[] = ['debit', 'credit'];

// Category mappings for test data
export const DEBIT_CATEGORIES: TransactionCategory[] = [
  'food',
  'grocery',
  'bills',
  'shopping',
  'travel',
  'other',
];

export const CREDIT_CATEGORIES: TransactionCategory[] = [
  'salary',
  'investments',
  'refund',
  'other',
];

// Sample amounts for test transactions
export const SAMPLE_AMOUNTS = [10.99, 25.5, 100, 500, 1000, 1500, 2000];

// Sample transaction descriptions
export const SAMPLE_DESCRIPTIONS = [
  'Lunch',
  'Uber ride',
  'Electric bill',
  'Movie tickets',
  'Monthly salary',
  'Birthday gift',
];

// Transaction modes for test data
export const TRANSACTION_MODES: TransactionMode[] = ['cash', 'card', 'upi', 'neft', 'other'];

// Alert types for test data
export const ALERT_TYPES: AlertType[] = ['income', 'spending'];

// Alert frequencies for test data
export const ALERT_FREQUENCIES: AlertFrequency[] = ['weekly', 'monthly'];

// Sample threshold amounts for alerts
export const SAMPLE_THRESHOLDS = [500, 1000, 2000, 5000];
