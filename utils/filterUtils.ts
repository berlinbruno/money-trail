import { getTransactions } from '@/lib/db/transactionQueries';
import { SQLiteDatabase } from 'expo-sqlite';

export const getDateRangeForPreset = (preset: string): { start: Date | null; end: Date | null } => {
  const today = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (preset) {
    case 'Today':
      start = new Date(today.setHours(0, 0, 0, 0));
      end = new Date(today.setHours(23, 59, 59, 999));
      break;
    case 'This Week':
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay()); // Sunday start
      start.setHours(0, 0, 0, 0);
      end = new Date(today.setHours(23, 59, 59, 999));
      break;
    case 'Last 30 Days':
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(today.setHours(23, 59, 59, 999));
      break;
    case 'all':
    default:
      start = null;
      end = null;
  }

  return { start, end };
};

// utils/transactions.ts
export const fetchTransactionsFromDB = async (
  db: SQLiteDatabase,
  filterState: {
    startDate: Date | null;
    endDate: Date | null;
    type: 'all' | 'credit' | 'debit';
    category: string;
    search: string;
  },
  sortBy: string,
  sortOrder: string,
  flaggedOnly: boolean
) => {
  const { startDate, endDate, type, category, search } = filterState;

  const validSortBy = sortBy === 'amount' || sortBy === 'date' ? sortBy : 'date';
  const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

  let start = startDate;
  let end = endDate;
  if (start && end && start > end) {
    start = null;
    end = null;
  }

  return await getTransactions(db, {
    type,
    category,
    search: search.trim(),
    startDate: start,
    endDate: end,
    sortBy: validSortBy,
    sortOrder: validSortOrder,
    flaggedOnly: flaggedOnly,
  });
};
