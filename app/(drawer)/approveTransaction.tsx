import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowUpDown, CheckCheck, Filter } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import FilterForm from '@/components/transaction/FilterForm';
import SortForm from '@/components/transaction/SortForm';
import TransactionCard from '@/components/transaction/TransactionCard';
import TransactionForm from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/button';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';

import {
  deleteTransaction,
  insertTransaction,
  updateAllTransactionFlags,
  updateTransaction,
  updateTransactionFlag,
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

export default function TransactionApprovalScreen() {
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
    // await insertTransactions(db);
    try {
      const rows = await fetchTransactionsFromDB(db, filterState, sortBy, sortOrder, true);
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

  const handleApproveTransaction = (id: string) => {
    if (!id) return;

    Alert.alert('Approve Transaction', 'Do you want to mark this transaction as approved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          await updateTransactionFlag(db, id, 0);
          fetchTransactions();
        },
      },
    ]);
  };

  const handleApproveAllTransactions = () => {
    Alert.alert('Approve All Transactions', 'Do you want to mark all transactions as approved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve All',
        style: 'default',
        onPress: async () => {
          await updateAllTransactionFlags(db, 0);
          fetchTransactions();
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

  /** --- Render --- **/
  return (
    <View className="flex-1">
      <SwipeListView
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchTransactions} />}
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
              size={null}
              variant="secondary"
              onPress={() => handleApproveTransaction(item.id)}
              className="h-full w-24 rounded-none">
              <Text>Approve</Text>
            </Button>
            <Button
              size={null}
              variant="destructive"
              onPress={() => handleDeleteTransaction(item.id)}
              className="mr-1 h-full w-24 rounded-none rounded-r-lg">
              <Text>Delete</Text>
            </Button>
          </View>
        )}
        rightOpenValue={-240}
        stopRightSwipe={-240}
        disableRightSwipe
        refreshing={isRefreshing}
        onRefresh={fetchTransactions}
      />

      {/* Transaction Form Modal */}
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
