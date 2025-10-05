import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
import {
  deleteTransaction,
  getPendingTransactionCount,
  getTransactions,
  updateTransactionFlag,
} from '@/lib/database/transactionQueries';
import { Transaction } from '@/types/Transaction';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

// Transaction filters interface
interface TransactionFilters {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  category: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// Transaction state hook
export const useTransactionState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  // Local state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    status: 'all',
    category: 'all',
    dateRange: 'all',
  });

  // Load transactions function
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on filters
      const queryParams: any = {
        sortBy: 'date',
        sortOrder: 'desc',
      };

      if (filters.category !== 'all') {
        queryParams.category = filters.category;
      }

      if (filters.searchTerm) {
        queryParams.search = filters.searchTerm;
      }

      // Handle status filter
      if (filters.status === 'pending') {
        queryParams.flaggedOnly = true;
      } else if (filters.status === 'approved') {
        queryParams.flaggedOnly = false;
      }
      // For 'all' status, we'll need to make two queries and combine

      if (filters.dateRange !== 'all') {
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            queryParams.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            queryParams.endDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              23,
              59,
              59
            );
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            queryParams.startDate = weekAgo;
            queryParams.endDate = now;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            queryParams.startDate = monthAgo;
            queryParams.endDate = now;
            break;
          case 'custom':
            if (filters.startDate) queryParams.startDate = new Date(filters.startDate);
            if (filters.endDate) queryParams.endDate = new Date(filters.endDate);
            break;
        }
      }

      let data: Transaction[] = [];

      if (filters.status === 'all') {
        // Get both pending and approved transactions
        const [pendingTx, approvedTx] = await Promise.all([
          getTransactions(db, { ...queryParams, flaggedOnly: true }),
          getTransactions(db, { ...queryParams, flaggedOnly: false }),
        ]);
        data = [...pendingTx, ...approvedTx].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } else {
        data = await getTransactions(db, queryParams);
      }

      setTransactions(data);
    } catch (err) {
      console.error('Load transactions failed:', err);
      setError('Failed to load transactions');
      showToast('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [db, filters, showToast]);

  // Load pending count
  const loadPendingCount = useCallback(async () => {
    try {
      const count = await getPendingTransactionCount(db);
      setPendingCount(count);
    } catch (err) {
      console.error('Load pending count failed:', err);
    }
  }, [db]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadTransactions();
    loadPendingCount();
  }, [loadTransactions, loadPendingCount, appState.transactionUpdateTrigger]);

  // Approve transaction with auto-refresh
  const approveTransaction = useCallback(
    async (transactionId: string) => {
      try {
        await updateTransactionFlag(db, transactionId, 0); // 0 = approved
        showToast('Transaction approved successfully');

        // Single efficient trigger that updates both transaction and dashboard
        appActions.triggerTransactionRefresh();

        return true;
      } catch (error) {
        console.error('Approve transaction failed:', error);
        showToast('Failed to approve transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  // Reject transaction with auto-refresh
  const rejectTransaction = useCallback(
    async (transactionId: string) => {
      try {
        // For now, we'll delete rejected transactions
        // You might want to add a rejected status instead
        await deleteTransaction(db, transactionId);
        showToast('Transaction rejected');

        // Single efficient trigger
        appActions.triggerTransactionRefresh();

        return true;
      } catch (error) {
        console.error('Reject transaction failed:', error);
        showToast('Failed to reject transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  // Delete transaction with auto-refresh
  const removeTransaction = useCallback(
    async (transactionId: string) => {
      try {
        await deleteTransaction(db, transactionId);
        showToast('Transaction deleted successfully');

        // Single efficient trigger
        appActions.triggerTransactionRefresh();

        return true;
      } catch (error) {
        console.error('Delete transaction failed:', error);
        showToast('Failed to delete transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      category: 'all',
      dateRange: 'all',
    });
  }, []);

  // Refresh manually
  const refresh = useCallback(async () => {
    appActions.setRefreshing(true);
    await Promise.all([loadTransactions(), loadPendingCount()]);
    appActions.setRefreshing(false);
  }, [loadTransactions, loadPendingCount, appActions]);

  return {
    // Data
    transactions,
    pendingCount,
    loading,
    error,
    filters,

    // Actions
    actions: {
      approveTransaction,
      rejectTransaction,
      removeTransaction,
      updateFilters,
      clearFilters,
      refresh,
      loadTransactions,
      loadPendingCount,
    },
  };
};
