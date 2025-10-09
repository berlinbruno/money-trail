import {
  TransactionListView,
  TransactionModals,
  TransactionToolbar,
} from '@/components/transaction';
import { useTransactionManager } from '@/hooks/useTransactionManager';
import { ArrowUpDown, CheckCheck, Filter } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionApprovalScreen() {
  const insets = useSafeAreaInsets();

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
    handleApproveTransaction,
    handleApproveAllTransactions,
    appState,
  } = useTransactionManager({ flaggedOnly: true, initialPreset: 'All' });

  // Configure list actions
  const listActions = [
    { label: 'Edit', variant: 'default' as const, onPress: handleEditTransaction },
    { label: 'Approve', variant: 'success' as const, onPress: handleApproveTransaction },
  ];

  const leftAction = {
    label: 'Delete',
    variant: 'destructive' as const,
    onPress: handleDeleteTransaction,
  };

  // Configure toolbar actions
  const toolbarActions = [
    { label: 'Filter', icon: Filter, onPress: () => setShowFilterModal(true) },
    { label: 'Approve All', icon: CheckCheck, onPress: handleApproveAllTransactions },
    { label: 'Sort', icon: ArrowUpDown, onPress: () => setShowSortModal(true) },
  ];

  return (
    <View className="flex-1">
      <TransactionListView
        transactions={transactions}
        isRefreshing={isRefreshing || appState.isRefreshing}
        onRefresh={() => handleFetchTransactions(true)}
        actions={listActions}
        leftAction={leftAction}
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

      <TransactionToolbar actions={toolbarActions} style={{ paddingBottom: insets.bottom }} />
    </View>
  );
}
