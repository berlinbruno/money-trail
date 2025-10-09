import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
import {
  deleteTransaction as deleteTransactionFromDB,
  getPendingTransactionCount,
  getTransactions,
  insertTransaction,
  updateAllTransactionFlags,
  updateTransactionFlag,
  updateTransaction as updateTransactionInDB,
} from '@/lib/database/transactionQueries';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

/**
 * Comprehensive transaction operations hook
 * Centralizes all transaction-related actions for consistent behavior
 * Includes automatic app-wide triggers and user feedback
 */
export const useTransaction = () => {
  const db = useSQLiteContext();
  const { actions: appActions } = useApp();
  const { showToast } = useToast();

  // Create new transaction
  const createTransaction = useCallback(
    async (transaction: NewTransaction): Promise<boolean> => {
      try {
        await insertTransaction(db, transaction);
        // Trigger comprehensive data update for new transaction
        appActions.triggerTransactionDataUpdate();
        showToast('Transaction created successfully');
        return true;
      } catch (error) {
        console.error('Create transaction failed:', error);
        showToast('Failed to create transaction');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Update existing transaction
  const updateTransaction = useCallback(
    async (transaction: EditTransaction): Promise<boolean> => {
      try {
        await updateTransactionInDB(db, transaction);
        // Trigger transaction list refresh for updates
        appActions.triggerTransactionListUpdate();
        showToast('Transaction updated successfully');
        return true;
      } catch (error) {
        console.error('Update transaction failed:', error);
        showToast('Failed to update transaction');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Delete transaction
  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      try {
        await deleteTransactionFromDB(db, transactionId);
        // Trigger app-wide refresh for dashboard, KPI, alerts and other components
        appActions.triggerTransactionDataUpdate();
        showToast('Transaction deleted successfully');
        return true;
      } catch (error) {
        console.error('Delete transaction failed:', error);
        showToast('Failed to delete transaction');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Approve single transaction
  const approveTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      try {
        await updateTransactionFlag(db, transactionId, 0); // 0 = approved
        // Trigger app-wide refresh for dashboard, KPI, alerts and other components
        appActions.triggerTransactionDataUpdate();
        showToast('Transaction approved');
        return true;
      } catch (error) {
        console.error('Approve transaction failed:', error);
        showToast('Failed to approve transaction');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Approve all pending transactions
  const approveAllTransactions = useCallback(async (): Promise<boolean> => {
    try {
      await updateAllTransactionFlags(db, 0); // 0 = approved
      // Trigger app-wide refresh for dashboard, KPI, alerts and other components
      appActions.triggerTransactionDataUpdate();
      showToast('All transactions approved');
      return true;
    } catch (error) {
      console.error('Approve all transactions failed:', error);
      showToast('Failed to approve all transactions');
      return false;
    }
  }, [db, appActions, showToast]);

  // Get pending transaction count
  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      return await getPendingTransactionCount(db);
    } catch (error) {
      console.error('Get pending count failed:', error);
      return 0;
    }
  }, [db]);

  // Fetch transactions with filtering and sorting
  const fetchTransactions = useCallback(
    async (
      filters: {
        type?: 'all' | 'credit' | 'debit';
        category?: string;
        search?: string;
        startDate?: Date | null;
        endDate?: Date | null;
        sortBy?: 'date' | 'amount';
        sortOrder?: 'asc' | 'desc';
        flaggedOnly?: boolean;
      } = {}
    ): Promise<Transaction[]> => {
      try {
        return await getTransactions(db, filters);
      } catch (error) {
        console.error('Fetch transactions failed:', error);
        showToast('Failed to load transactions');
        return [];
      }
    },
    [db, showToast]
  );

  // Bulk operations
  const bulkApproveTransactions = useCallback(
    async (transactionIds: string[]): Promise<boolean> => {
      try {
        await db.withTransactionAsync(async () => {
          for (const id of transactionIds) {
            await updateTransactionFlag(db, id, 0);
          }
        });
        // Trigger app-wide refresh
        appActions.triggerTransactionDataUpdate();
        showToast(`${transactionIds.length} transactions approved`);
        return true;
      } catch (error) {
        console.error('Bulk approve failed:', error);
        showToast('Failed to approve transactions');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  const bulkDeleteTransactions = useCallback(
    async (transactionIds: string[]): Promise<boolean> => {
      try {
        await db.withTransactionAsync(async () => {
          for (const id of transactionIds) {
            await deleteTransactionFromDB(db, id);
          }
        });
        // Trigger app-wide refresh
        appActions.triggerTransactionDataUpdate();
        showToast(`${transactionIds.length} transactions deleted`);
        return true;
      } catch (error) {
        console.error('Bulk delete failed:', error);
        showToast('Failed to delete transactions');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Duplicate transaction
  const duplicateTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      try {
        const transactions = await getTransactions(db, {});
        const original = transactions.find((t) => t.id === transactionId);

        if (!original) {
          showToast('Transaction not found');
          return false;
        }

        const duplicate: NewTransaction = {
          title: `${original.title} (Copy)`,
          amount: original.amount,
          category: original.category,
          type: original.type,
          date: new Date().toISOString(),
          account: original.account,
          mode: original.mode,
          source: 'manual',
          created_at: new Date().toISOString(),
          pending_approval: 0,
          sms_hash: `duplicate_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        };

        await insertTransaction(db, duplicate);
        appActions.triggerTransactionDataUpdate();
        showToast('Transaction duplicated');
        return true;
      } catch (error) {
        console.error('Duplicate transaction failed:', error);
        showToast('Failed to duplicate transaction');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Toggle transaction approval status
  const toggleTransactionApproval = useCallback(
    async (transactionId: string, currentStatus: 0 | 1): Promise<boolean> => {
      try {
        const newStatus = currentStatus === 0 ? 1 : 0; // Toggle status
        await updateTransactionFlag(db, transactionId, newStatus);
        appActions.triggerTransactionDataUpdate();
        showToast(newStatus === 0 ? 'Transaction approved' : 'Transaction flagged for review');
        return true;
      } catch (error) {
        console.error('Toggle approval failed:', error);
        showToast('Failed to update transaction status');
        return false;
      }
    },
    [db, appActions, showToast]
  );

  // Search transactions by text
  const searchTransactions = useCallback(
    async (searchText: string): Promise<Transaction[]> => {
      try {
        return await getTransactions(db, { search: searchText });
      } catch (error) {
        console.error('Search transactions failed:', error);
        showToast('Search failed');
        return [];
      }
    },
    [db, showToast]
  );

  // Optimized local state update helper for immediate UI feedback
  const updateTransactionState = useCallback(
    (
      setTransactions: React.Dispatch<React.SetStateAction<Transaction[] | null>>,
      operation: 'approve' | 'approve_all' | 'delete',
      transactionId?: string
    ) => {
      setTransactions((prev) => {
        if (!prev) return null;

        switch (operation) {
          case 'approve':
            return transactionId
              ? prev.map((tx) => (tx.id === transactionId ? { ...tx, pending_approval: 0 } : tx))
              : prev;

          case 'approve_all':
            return prev.map((tx) => ({ ...tx, pending_approval: 0 }));

          case 'delete':
            return transactionId ? prev.filter((tx) => tx.id !== transactionId) : prev;

          default:
            return prev;
        }
      });
    },
    []
  );

  return {
    // Basic CRUD operations
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Approval operations
    approveTransaction,
    approveAllTransactions,
    toggleTransactionApproval,

    // Query operations
    fetchTransactions,
    getPendingCount,
    searchTransactions,

    // Bulk operations
    bulkApproveTransactions,
    bulkDeleteTransactions,

    // Utility operations
    duplicateTransaction,
    updateTransactionState,
  };
};
