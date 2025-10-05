import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowUpDown, CheckCheck, Filter } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import FilterForm from '@/components/transaction/FilterForm';
import SortForm from '@/components/transaction/SortForm';
import TransactionCard from '@/components/transaction/TransactionCard';
import TransactionForm from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/button';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';
import { useTransaction } from '@/hooks/useTransaction';

import { insertTransaction, updateTransaction } from '@/lib/database/transactionQueries';

import { FilterState } from '@/types/FilterState';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import { fetchTransactionsFromDB, getDateRangeForPreset } from '@/utils/transactions/filterUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Type Guard
const isEditTransaction = (
  tx: Transaction | NewTransaction | EditTransaction
): tx is EditTransaction => {
  return (tx as EditTransaction).id !== undefined;
};

export default function TransactionApprovalScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const insets = useSafeAreaInsets();
  const { state: appState, actions: appActions } = useApp();
  const { approveTransaction, approveAllTransactions, removeTransaction, updateTransactionState } =
    useTransaction();

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    selectedPreset: 'all',
    startDate: new Date(),
    endDate: new Date(),
    showStartPicker: false,
    showEndPicker: false,
  });

  const applyDatePreset = useCallback((preset: string) => {
    const { start, end } = getDateRangeForPreset(preset);

    setFilterState((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      selectedPreset: preset,
    }));
  }, []);

  const fetchTransactions = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsRefreshing(true);
      // await insertTransactions(db);
      try {
        const rows = await fetchTransactionsFromDB(db, filterState, sortBy, sortOrder, true);
        setTransactions(rows);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        showToast('Failed to load transactions');
      } finally {
        if (showLoader) setIsRefreshing(false);
      }
    },
    [db, filterState, sortBy, sortOrder, showToast]
  );

  const handleEditTransaction = (id: string) => {
    const tx = transactions?.find((t) => t.id === id);
    if (tx) {
      setSelectedTransaction(tx);
      setShowTransactionModal(true);
    }
  };

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      if (!id) return;

      showConfirmationDialog({
        title: 'Delete Transaction',
        description:
          'Are you sure you want to delete this transaction? This action cannot be undone.',
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting...',
        onConfirm: async () => {
          try {
            // Update local state immediately for better UX
            updateTransactionState(setTransactions, 'delete', id);
            // Perform database operation and trigger global updates
            await removeTransaction(id);
          } catch (err) {
            console.error('Failed to delete transaction:', err);
            // Refresh data to revert optimistic update on error
            await fetchTransactions(false);
            throw err; // Let the dialog handle the error state
          }
        },
      });
    },
    [removeTransaction, updateTransactionState, fetchTransactions, showConfirmationDialog]
  );

  const handleApproveTransaction = useCallback(
    (id: string) => {
      if (!id) return;

      showConfirmationDialog({
        title: 'Approve Transaction',
        description: 'Are you sure you want to approve this transaction?',
        confirmText: 'Approve',
        confirmVariant: 'default',
        loadingText: 'Approving...',
        onConfirm: async () => {
          try {
            // Update local state immediately for better UX
            updateTransactionState(setTransactions, 'approve', id);
            // Perform database operation and trigger global updates
            await approveTransaction(id);
          } catch (err) {
            console.error('Failed to approve transaction:', err);
            // Refresh data to revert optimistic update on error
            await fetchTransactions(false);
            throw err; // Let the dialog handle the error state
          }
        },
      });
    },
    [approveTransaction, updateTransactionState, fetchTransactions, showConfirmationDialog]
  );

  const handleApproveAllTransactions = useCallback(() => {
    showConfirmationDialog({
      title: 'Approve All Transactions',
      description: 'Are you sure you want to approve all pending transactions?',
      confirmText: 'Approve All',
      confirmVariant: 'default',
      loadingText: 'Approving all...',
      onConfirm: async () => {
        try {
          // Update local state immediately for better UX
          updateTransactionState(setTransactions, 'approve_all');
          // Perform database operation and trigger global updates
          await approveAllTransactions();
        } catch (err) {
          console.error('Failed to approve all transactions:', err);
          // Refresh data to revert optimistic update on error
          await fetchTransactions(false);
          throw err; // Let the dialog handle the error state
        }
      },
    });
  }, [approveAllTransactions, updateTransactionState, fetchTransactions, showConfirmationDialog]);

  // Initialize date preset once
  useEffect(() => {
    applyDatePreset('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Safe to disable - we only want this to run once

  // Fetch transactions when filter dependencies change
  useEffect(() => {
    if (filterState.selectedPreset) {
      // Only fetch if preset is set
      fetchTransactions(false); // Silent initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState, sortBy, sortOrder]); // Safe to disable - fetchTransactions is stable

  // Refresh transactions when transaction list trigger changes
  useEffect(() => {
    if (filterState.selectedPreset) {
      fetchTransactions(false); // Silent refresh when triggered
    }
  }, [appState.transactionListTrigger, fetchTransactions, filterState.selectedPreset]);

  /** --- Render --- **/
  return (
    <View className="flex-1">
      <SwipeListView
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || appState.isRefreshing}
            onRefresh={() => fetchTransactions(true)}
          />
        }
        renderItem={({ item }) => (
          <TransactionCard
            title={item.title}
            amount={item.amount}
            date={item.date}
            type={item.type}
            category={item.category}
          />
        )}
        renderHiddenItem={({ item }) => (
          <View className="m-1 h-20 flex-row items-start justify-between">
            <Button
              size={null}
              variant="destructive"
              onPress={() => handleDeleteTransaction(item.id)}
              className="ml-1 h-full w-24 rounded-none rounded-l-lg">
              <Text>Delete</Text>
            </Button>
            <View className="h-20 flex-1 flex-row justify-end">
              <Button
                variant="default"
                size={null}
                onPress={() => handleEditTransaction(item.id)}
                className="h-full w-24 rounded-none">
                <Text>Edit</Text>
              </Button>
              <Button
                size={null}
                variant="success"
                onPress={() => handleApproveTransaction(item.id)}
                className="mr-1 h-full w-24 rounded-none rounded-r-lg">
                <Text>Approve</Text>
              </Button>
            </View>
          </View>
        )}
        leftOpenValue={90}
        stopLeftSwipe={90}
        rightOpenValue={-180}
        stopRightSwipe={-180}
        disableRightSwipe={false}
        refreshing={isRefreshing}
        onRefresh={() => fetchTransactions(true)}
      />

      {/* Transaction Form Modal */}
      <BaseModal
        title={selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}>
        <TransactionForm
          transaction={selectedTransaction}
          onSubmit={async (transaction) => {
            try {
              if (isEditTransaction(transaction)) {
                await updateTransaction(db, transaction);
                showToast('Transaction updated');
                // Trigger transaction list refresh for edit
                appActions.triggerTransactionListUpdate();
              } else {
                await insertTransaction(db, transaction);
                showToast('Transaction added');
                // Trigger comprehensive data update for new transaction
                appActions.triggerTransactionDataUpdate();
              }
              await fetchTransactions(false); // Silent refresh
              setShowTransactionModal(false);
              setSelectedTransaction(undefined);
            } catch (err) {
              console.error('Failed to save transaction:', err);
              showToast('Failed to save transaction');
            }
          }}
          onCancel={() => {
            setShowTransactionModal(false);
            setSelectedTransaction(undefined);
          }}
        />
      </BaseModal>

      {/* Filter Modal */}
      <BaseModal title="Filter" visible={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <FilterForm
          filterState={filterState}
          setFilterState={setFilterState}
          presets={['Today', 'This Week', 'Last 30 Days']}
          applyPreset={applyDatePreset}
          onClose={() => setShowFilterModal(false)}
        />
      </BaseModal>

      {/* Sort Modal */}
      <BaseModal title="Sort" visible={showSortModal} onClose={() => setShowSortModal(false)}>
        <SortForm
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClose={() => setShowSortModal(false)}
        />
      </BaseModal>

      {/* Footer Tab-Style Buttons */}
      <View
        className="flex-row border-t border-border bg-card"
        style={{ paddingBottom: insets.bottom }}>
        <Button
          variant="ghost"
          onPress={() => setShowFilterModal(true)}
          className="flex-1 flex-row gap-2 rounded-none">
          <Filter color={theme.colors.text} size={18} />
          <Text className="text-sm font-medium">Filter</Text>
        </Button>

        <View className="w-px bg-border" />

        <Button
          variant="ghost"
          onPress={() => handleApproveAllTransactions()}
          className="flex-1 flex-row gap-2 rounded-none">
          <CheckCheck color={theme.colors.text} size={18} />
          <Text className="text-sm font-medium">Approve All</Text>
        </Button>

        <View className="w-px bg-border" />

        <Button
          variant="ghost"
          onPress={() => setShowSortModal(true)}
          className="flex-1 flex-row gap-2 rounded-none">
          <ArrowUpDown color={theme.colors.text} size={18} />
          <Text className="text-sm font-medium">Sort</Text>
        </Button>
      </View>
    </View>
  );
}
