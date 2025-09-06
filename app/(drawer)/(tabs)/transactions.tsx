// TransactionListScreen.tsx
import FilterForm from '@/components/transaction/FilterForm';
import SortForm from '@/components/transaction/SortForm';
import TransactionCard from '@/components/transaction/TransactionCard';
import TransactionForm from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/button';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
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
} from '@/lib/db/transactionQueries';

import { FilterState } from '@/types/FilterState';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import { fetchTransactionsFromDB, getDateRangeForPreset } from '@/utils/filterUtils';

// Type Guard
const isEditTransaction = (
  tx: Transaction | NewTransaction | EditTransaction
): tx is EditTransaction => {
  return (tx as EditTransaction).id !== undefined;
};

export default function TransactionListScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();

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

  const fetchTransactions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const rows = await fetchTransactionsFromDB(db, filterState, sortBy, sortOrder, false);
      setTransactions(rows);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [db, filterState, sortBy, sortOrder]);

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
            await fetchTransactions();
          } catch (err) {
            console.error('Failed to delete transaction:', err);
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    applyDatePreset('all');
  }, [applyDatePreset]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
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
        onRefresh={fetchTransactions}
      />

      {/* Transaction Modal */}
      <BaseModal
        title={selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}>
        <TransactionForm
          transaction={selectedTransaction}
          onSubmit={async (transaction) => {
            if (isEditTransaction(transaction)) {
              await updateTransaction(db, transaction);
            } else {
              await insertTransaction(db, transaction);
            }
            await fetchTransactions();
            setShowTransactionModal(false);
            setSelectedTransaction(undefined);
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
