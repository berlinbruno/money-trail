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
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';

import {
  deleteTransaction,
  insertTransaction,
  updateAllTransactionFlags,
  updateTransaction,
  updateTransactionFlag,
} from '@/lib/database/transactionQueries';

import { FilterState } from '@/types/FilterState';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import { fetchTransactionsFromDB, getDateRangeForPreset } from '@/utils/transactions/filterUtils';

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
            await deleteTransaction(db, id);
            await fetchTransactions(false); // Silent refresh
            showToast('Transaction deleted');
          } catch (err) {
            console.error('Failed to delete transaction:', err);
            showToast('Failed to delete transaction');
            throw err; // Let the dialog handle the error state
          }
        },
      });
    },
    [db, fetchTransactions, showToast, showConfirmationDialog]
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
            await updateTransactionFlag(db, id, 0);
            await fetchTransactions(false); // Silent refresh
            showToast('Transaction approved');
          } catch (err) {
            console.error('Failed to approve transaction:', err);
            showToast('Failed to approve transaction');
            throw err; // Let the dialog handle the error state
          }
        },
      });
    },
    [db, fetchTransactions, showToast, showConfirmationDialog]
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
          await updateAllTransactionFlags(db, 0);
          await fetchTransactions(false); // Silent refresh
          showToast('All transactions approved');
        } catch (err) {
          console.error('Failed to approve all transactions:', err);
          showToast('Failed to approve all transactions');
          throw err; // Let the dialog handle the error state
        }
      },
    });
  }, [db, fetchTransactions, showToast, showConfirmationDialog]);

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

  /** --- Render --- **/
  return (
    <View className="flex-1">
      <SwipeListView
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchTransactions(true)} />
        }
        renderItem={({ item }) => (
          <TransactionCard
            title={item.title}
            amount={item.amount}
            date={item.date}
            type={item.type}
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
                variant="secondary"
                onPress={() => handleApproveTransaction(item.id)}
                className="h-full w-24 rounded-none rounded-r-lg">
                <Text>Approve</Text>
              </Button>
            </View>
          </View>
        )}
        leftOpenValue={80}
        stopLeftSwipe={80}
        rightOpenValue={-160}
        stopRightSwipe={-160}
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
              } else {
                await insertTransaction(db, transaction);
                showToast('Transaction added');
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

      {/* Footer Buttons */}
      <View className="mb-4 flex-row items-center justify-evenly border-t border-border bg-background py-3">
        <Button
          variant="static"
          onPress={() => setShowFilterModal(true)}
          className="flex-row gap-1">
          <Filter color={theme.colors.text} />
          <Text>Filter</Text>
        </Button>
        <Button
          variant="static"
          onPress={() => handleApproveAllTransactions()}
          className="flex-row gap-1">
          <CheckCheck color={theme.colors.text} />
          <Text>Approve All</Text>
        </Button>
        <Button variant="static" onPress={() => setShowSortModal(true)} className="flex-row gap-1">
          <ArrowUpDown color={theme.colors.text} />
          <Text>Sort</Text>
        </Button>
      </View>
    </View>
  );
}
