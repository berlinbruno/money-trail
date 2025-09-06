import {
  CREDIT_CATEGORIES,
  DEBIT_CATEGORIES,
  TRANSACTION_MODES,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPE,
} from '@/constants/transactionConstants';
import { ID, Timestamp } from './Common';

export type DebitCategory = (typeof DEBIT_CATEGORIES)[number];
export type CreditCategory = (typeof CREDIT_CATEGORIES)[number];
export type TransactionCategory = DebitCategory | CreditCategory;
export type TransactionType = (typeof TRANSACTION_TYPE)[number];
export type TransactionMode = (typeof TRANSACTION_MODES)[number];
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export interface Transaction {
  id: ID;
  account: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: Timestamp;
  mode: TransactionMode;
  category: TransactionCategory;
  created_at: Timestamp;
  updated_at?: Timestamp;
  source?: TransactionSource;
  pending_approval: 0 | 1;
}

export interface NewTransaction {
  account: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: Timestamp;
  mode: TransactionMode;
  category: TransactionCategory;
  created_at: Timestamp;
  source: TransactionSource;
  pending_approval: 0 | 1;
  sms_hash: string;
}

export interface EditTransaction {
  id: ID;
  account: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: Timestamp;
  mode: TransactionMode;
  category: TransactionCategory;
  updated_at: Timestamp;
  source: TransactionSource;
  pending_approval: 0 | 1;
}
