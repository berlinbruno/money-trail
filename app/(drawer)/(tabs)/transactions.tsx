// TransactionListScreen.tsx
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
import { useTransactionState } from '@/hooks/useTransactionState';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowUpDown, Filter, PlusCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import { insertTransaction, updateTransaction } from '@/lib/database/transactionQueries';

import { FilterState } from '@/types/FilterState';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import { getDateRangeForPreset } from '@/utils/transactions/filterUtils';

// Type Guard
const isEditTransaction = (
  tx: Transaction | NewTransaction | EditTransaction
): tx is EditTransaction => {
  return (tx as EditTransaction).id !== undefined;
};

export default function TransactionListScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const { state: appState, actions: appActions } = useApp();
  const { transactions, actions: transactionActions } = useTransactionState();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();
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
          await transactionActions.removeTransaction(id);
        },
      });
    },
    [transactionActions, showConfirmationDialog]
  );

  // Initialize date preset once
  useEffect(() => {
    applyDatePreset('all');
  }, [applyDatePreset]);
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
            category={item.category}
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
        refreshing={appState.isRefreshing}
        onRefresh={() => appActions.triggerTransactionRefresh()}
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
                showToast('Transaction has been modified');
              } else {
                await insertTransaction(db, transaction);
                showToast('New transaction has been created');
              }
              // Trigger refresh via AppContext
              appActions.triggerTransactionRefresh();
              setShowTransactionModal(false);
              setSelectedTransaction(undefined);
            } catch (err) {
              console.error('Failed to save transaction:', err);
              showToast('Unable to save transaction');
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

      {/* Bottom Tab-Style Toolbar */}
      <View className="flex-row border-t border-border bg-card">
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
          onPress={() => {
            setSelectedTransaction(undefined);
            setShowTransactionModal(true);
          }}
          className="flex-1 flex-row gap-2 rounded-none">
          <PlusCircle color={theme.colors.text} size={18} />
          <Text className="text-sm font-medium">Add</Text>
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
