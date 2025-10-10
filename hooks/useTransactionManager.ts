import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';
import { useTransaction } from '@/hooks/useTransaction';
import { FilterState } from '@/types/FilterState';
import { Transaction } from '@/types/Transaction';
import { getDateRangeForPreset } from '@/utils/transactions/filterUtils';
import { useCallback, useEffect, useState } from 'react';

interface TransactionManagerOptions {
  flaggedOnly?: boolean;
  initialPreset?: string;
}

/**
 * Comprehensive transaction management hook
 * Handles all transaction operations, state, and UI interactions
 */
export const useTransactionManager = ({
  flaggedOnly = false,
  initialPreset = 'All',
}: TransactionManagerOptions = {}) => {
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const { state: appState } = useApp();
  const {
    fetchTransactions,
    deleteTransaction,
    approveTransaction,
    approveAllTransactions,
    updateTransactionState,
  } = useTransaction();

  // Main state
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    selectedPreset: '',
    startDate: null,
    endDate: null,
    showStartPicker: false,
    showEndPicker: false,
  });

  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();

  // Apply date preset
  const applyDatePreset = useCallback((preset: string) => {
    const { start, end } = getDateRangeForPreset(preset);
    setFilterState((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      selectedPreset: preset,
    }));
  }, []);

  // Fetch transactions
  const handleFetchTransactions = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsRefreshing(true);
      try {
        const rows = await fetchTransactions({
          type: filterState.type === 'all' ? undefined : filterState.type,
          category: filterState.category === 'all' ? undefined : filterState.category,
          search: filterState.search,
          startDate: filterState.startDate,
          endDate: filterState.endDate,
          sortBy: sortBy as 'date' | 'amount',
          sortOrder: sortOrder,
          flaggedOnly,
        });
        setTransactions(rows);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        showToast('Failed to load transactions');
      } finally {
        if (showLoader) setIsRefreshing(false);
      }
    },
    [fetchTransactions, filterState, sortBy, sortOrder, flaggedOnly, showToast]
  );

  // Transaction actions
  const handleEditTransaction = useCallback(
    (id: string) => {
      const tx = transactions?.find((t) => t.id === id);
      if (tx) {
        setSelectedTransaction(tx);
        setShowTransactionModal(true);
      }
    },
    [transactions]
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      showConfirmationDialog({
        title: 'Delete Transaction',
        description: 'Are you sure you want to delete this transaction?',
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting...',
        onConfirm: async () => {
          updateTransactionState(setTransactions, 'delete', id);
          await deleteTransaction(id);
        },
      });
    },
    [deleteTransaction, updateTransactionState, showConfirmationDialog]
  );

  const handleApproveTransaction = useCallback(
    (id: string) => {
      showConfirmationDialog({
        title: 'Approve Transaction',
        description: 'Are you sure you want to approve this transaction?',
        confirmText: 'Approve',
        confirmVariant: 'default',
        loadingText: 'Approving...',
        onConfirm: async () => {
          updateTransactionState(setTransactions, 'approve', id);
          await approveTransaction(id);
        },
      });
    },
    [approveTransaction, updateTransactionState, showConfirmationDialog]
  );

  const handleApproveAllTransactions = useCallback(() => {
    showConfirmationDialog({
      title: 'Approve All Transactions',
      description: 'Are you sure you want to approve all pending transactions?',
      confirmText: 'Approve All',
      confirmVariant: 'default',
      loadingText: 'Approving all...',
      onConfirm: async () => {
        updateTransactionState(setTransactions, 'approve_all');
        await approveAllTransactions();
      },
    });
  }, [approveAllTransactions, updateTransactionState, showConfirmationDialog]);

  // Modal handlers
  const handleAddTransaction = useCallback(() => {
    setSelectedTransaction(undefined);
    setShowTransactionModal(true);
  }, []);

  const handleCloseTransactionModal = useCallback(() => {
    setShowTransactionModal(false);
    setSelectedTransaction(undefined);
  }, []);

  // Initialize and effects
  useEffect(() => {
    applyDatePreset(initialPreset);
  }, [applyDatePreset, initialPreset]);

  useEffect(() => {
    if (filterState.selectedPreset) {
      handleFetchTransactions(false);
    }
  }, [filterState, sortBy, sortOrder, handleFetchTransactions]);

  useEffect(() => {
    if (filterState.selectedPreset) {
      handleFetchTransactions(false);
    }
  }, [appState.transactionListTrigger, handleFetchTransactions, filterState.selectedPreset]);

  return {
    // State
    transactions,
    isRefreshing,
    sortOrder,
    setSortOrder,
    sortBy,
    setSortBy,
    filterState,
    setFilterState,

    // Modal states
    showFilterModal,
    setShowFilterModal,
    showSortModal,
    setShowSortModal,
    showTransactionModal,
    setShowTransactionModal,
    selectedTransaction,

    // Actions
    applyDatePreset,
    handleFetchTransactions,
    handleEditTransaction,
    handleDeleteTransaction,
    handleApproveTransaction,
    handleApproveAllTransactions,
    handleAddTransaction,
    handleCloseTransactionModal,

    // Utils
    appState,
  };
};
