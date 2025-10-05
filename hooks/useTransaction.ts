import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
import {
  deleteTransaction,
  updateAllTransactionFlags,
  updateTransactionFlag,
} from '@/lib/database/transactionQueries';
import { Transaction } from '@/types/Transaction';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

/**
 * Lightweight transaction operations hook
 * This replaces the heavy useTransactionState hook for better performance
 * Focus on actions only, let components manage their own data state
 */
export const useTransaction = () => {
  const db = useSQLiteContext();
  const { actions: appActions } = useApp();
  const { showToast } = useToast();

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

  // Delete transaction
  const removeTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      try {
        await deleteTransaction(db, transactionId);
        // Trigger app-wide refresh for dashboard, KPI, alerts and other components
        appActions.triggerTransactionDataUpdate();
        showToast('Transaction deleted');
        return true;
      } catch (error) {
        console.error('Delete transaction failed:', error);
        showToast('Failed to delete transaction');
        return false;
      }
    },
    [db, appActions, showToast]
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
    approveTransaction,
    approveAllTransactions,
    removeTransaction,
    updateTransactionState,
  };
};
