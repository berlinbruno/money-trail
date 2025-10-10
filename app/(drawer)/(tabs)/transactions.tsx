import {
  TransactionListView,
  TransactionModals,
  TransactionToolbar,
} from '@/components/transaction';
import { useTransactionManager } from '@/hooks/useTransactionManager';
import { ArrowUpDown, Filter, PlusCircle } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export default function TransactionListScreen() {
  const {
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
    handleAddTransaction,
    appState,
  } = useTransactionManager({ flaggedOnly: false });

  // Configure list actions
  const listActions = [
    { label: 'Edit', variant: 'default' as const, onPress: handleEditTransaction },
    { label: 'Delete', variant: 'destructive' as const, onPress: handleDeleteTransaction },
  ];

  // Configure toolbar actions
  const toolbarActions = [
    { label: 'Filter', icon: Filter, onPress: () => setShowFilterModal(true) },
    { label: 'Add', icon: PlusCircle, onPress: handleAddTransaction },
    { label: 'Sort', icon: ArrowUpDown, onPress: () => setShowSortModal(true) },
  ];

  return (
    <View className="flex-1">
      <TransactionListView
        transactions={transactions}
        isRefreshing={isRefreshing || appState.isRefreshing}
        onRefresh={() => handleFetchTransactions(true)}
        actions={listActions}
      />

      <TransactionModals
        showTransactionModal={showTransactionModal}
        setShowTransactionModal={setShowTransactionModal}
        selectedTransaction={selectedTransaction}
        setSelectedTransaction={() => {}}
        onTransactionSave={() => handleFetchTransactions(false)}
        showFilterModal={showFilterModal}
        setShowFilterModal={setShowFilterModal}
        filterState={filterState}
        setFilterState={setFilterState}
        filterPresets={['All', 'Today', 'Last 7 Days', 'Last 30 Days']}
        applyDatePreset={applyDatePreset}
        showSortModal={showSortModal}
        setShowSortModal={setShowSortModal}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <TransactionToolbar actions={toolbarActions} />
    </View>
  );
}
