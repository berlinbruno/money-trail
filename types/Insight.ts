import { Direction, ID, Timestamp } from './Common';
import { TransactionCategory, TransactionType } from './Transaction';

type periodData = {
  labels: string[];
  incomes: number[];
  expenses: number[];
  savings: number[];
  previousIncomes: number[];
  previousExpenses: number[];
  previousSavings: number[];
};

export type insightsDataset = {
  Daily: periodData;
  Weekly: periodData;
  Monthly: periodData;
  Yearly: periodData;
};

export type KPIData = {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
};

export type RecentTx = {
  id: ID;
  title: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  date: Timestamp;
};
export type TrendRow = {
  id: ID;
  label: string;
  value: number;
  color: string;
  direction: Direction;
};

export type TopDeviationRow = {
  id: ID;
  label: string;
  numeric_value: number;
  value: number;
  direction: Direction;
};

export interface TimeSeriesRecord {
  label: string;
  income?: number;
  expense?: number;
  savings?: number;
  previousIncome?: number;
  previousExpense?: number;
  previousSavings?: number;
}

export interface InsightsSummary {
  highestExpenseAmount: number;
  highestExpenseCategory: string;
  averageExpense: number;
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  value: number;
  color: string;
  gradientCenterColor: string;
  focused: boolean;
}

export type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
