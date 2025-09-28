// TransactionListScreen.tsx
import FilterForm from '@/components/transaction/FilterForm';
import SortForm from '@/components/transaction/SortForm';
import TransactionCard from '@/components/transaction/TransactionCard';
import TransactionForm from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/button';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useToastHelpers } from '@/contexts/ToastProvider';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowUpDown, Filter, PlusCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import {
  deleteTransaction,
  insertTransaction,
  updateTransaction,
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

export default function TransactionListScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { showSuccess, showError } = useToastHelpers();

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
      try {
        const rows = await fetchTransactionsFromDB(db, filterState, sortBy, sortOrder, false);
        setTransactions(rows);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        showError({
          title: 'Loading Failed',
          description: 'Unable to load transactions',
        });
      } finally {
        if (showLoader) setIsRefreshing(false);
      }
    },
    [db, filterState, sortBy, sortOrder, showError]
  );

  const handleEditTransaction = (id: string) => {
    const tx = transactions?.find((t) => t.id === id);
    if (tx) {
      setSelectedTransaction(tx);
      setShowTransactionModal(true);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (!id) return;
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(db, id);
            await fetchTransactions(false); // Silent refresh
            showSuccess({
              title: 'Transaction Deleted',
              description: 'Transaction has been removed',
            });
          } catch (err) {
            console.error('Failed to delete transaction:', err);
            showError({
              title: 'Delete Failed',
              description: 'Unable to delete transaction',
            });
          }
        },
      },
    ]);
  };

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
  return (
    <View className="flex-1">
      <SwipeListView
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard
            title={item.title}
            amount={item.amount}
            date={item.date}
            type={item.type}
          />
        )}
        renderHiddenItem={({ item }) => (
          <View className="m-1 h-20 flex-row items-start justify-end">
            <Button
              variant="default"
              size={null}
              onPress={() => handleEditTransaction(item.id)}
              className="h-full w-24 rounded-none">
              <Text>Edit</Text>
            </Button>
            <Button
              variant="destructive"
              size={null}
              onPress={() => handleDeleteTransaction(item.id)}
              className="mr-1 h-full w-24 rounded-none rounded-r-lg">
              <Text>Delete</Text>
            </Button>
          </View>
        )}
        rightOpenValue={-180}
        stopRightSwipe={-180}
        disableRightSwipe
        refreshing={isRefreshing}
        onRefresh={() => fetchTransactions(true)}
      />

      {/* Transaction Modal */}
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
                showSuccess({
                  title: 'Transaction Updated',
                  description: 'Transaction has been modified',
                });
              } else {
                await insertTransaction(db, transaction);
                showSuccess({
                  title: 'Transaction Added',
                  description: 'New transaction has been created',
                });
              }
              await fetchTransactions(false); // Silent refresh
              setShowTransactionModal(false);
              setSelectedTransaction(undefined);
            } catch (err) {
              console.error('Failed to save transaction:', err);
              showError({
                title: 'Save Failed',
                description: 'Unable to save transaction',
              });
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

      {/* Bottom Toolbar */}
      <View className="flex-row items-center justify-evenly border-t border-border bg-background">
        <Button
          variant="static"
          className="flex-row items-center justify-center gap-1"
          onPress={() => setShowFilterModal(true)}>
          <Filter color={theme.colors.text} />
          <Text>Filter</Text>
        </Button>
        <Button
          size="icon"
          variant="static"
          className="flex-row items-center justify-center gap-1"
          onPress={() => {
            setSelectedTransaction(undefined);
            setShowTransactionModal(true);
          }}>
          <PlusCircle color={theme.colors.text} />
        </Button>
        <Button
          variant="static"
          className="flex-row items-center justify-center gap-1"
          onPress={() => setShowSortModal(true)}>
          <ArrowUpDown color={theme.colors.text} />
          <Text>Sort</Text>
        </Button>
      </View>
    </View>
  );
}
