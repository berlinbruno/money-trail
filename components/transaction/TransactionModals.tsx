import FilterForm from '@/components/transaction/FilterForm';
import SortForm from '@/components/transaction/SortForm';
import TransactionForm from '@/components/transaction/TransactionForm';
import BaseModal from '@/components/ui/modal';
import { useToast } from '@/contexts/ToastProvider';
import { useTransaction } from '@/hooks/useTransaction';
import { FilterState } from '@/types/FilterState';
import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction';
import React, { useCallback } from 'react';

// Type Guard
const isEditTransaction = (
  tx: Transaction | NewTransaction | EditTransaction
): tx is EditTransaction => {
  return (tx as EditTransaction).id !== undefined;
};

interface TransactionModalsProps {
  // Transaction Modal
  showTransactionModal: boolean;
  setShowTransactionModal: (show: boolean) => void;
  selectedTransaction?: Transaction;
  setSelectedTransaction: (transaction: Transaction | undefined) => void;
  onTransactionSave?: () => void; // Optional callback after saving

  // Filter Modal
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  filterPresets: string[];
  applyDatePreset: (preset: string) => void;

  // Sort Modal
  showSortModal: boolean;
  setShowSortModal: (show: boolean) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  sortBy: 'date' | 'amount';
  setSortBy: React.Dispatch<React.SetStateAction<'date' | 'amount'>>;
}

/**
 * Unified modal management component for transactions
 * Handles Transaction Form, Filter, and Sort modals
 */
export default function TransactionModals({
  // Transaction Modal props
  showTransactionModal,
  setShowTransactionModal,
  selectedTransaction,
  setSelectedTransaction,
  onTransactionSave,

  // Filter Modal props
  showFilterModal,
  setShowFilterModal,
  filterState,
  setFilterState,
  filterPresets,
  applyDatePreset,

  // Sort Modal props
  showSortModal,
  setShowSortModal,
  sortOrder,
  setSortOrder,
  sortBy,
  setSortBy,
}: TransactionModalsProps) {
  const { showToast } = useToast();
  const { updateTransaction, createTransaction } = useTransaction();

  const handleTransactionSubmit = useCallback(
    async (transaction: NewTransaction | EditTransaction) => {
      try {
        if (isEditTransaction(transaction)) {
          await updateTransaction(transaction);
        } else {
          await createTransaction(transaction);
        }

        // Call optional callback
        onTransactionSave?.();

        // Close modal and reset state
        setShowTransactionModal(false);
        setSelectedTransaction(undefined);
      } catch (err) {
        console.error('Failed to save transaction:', err);
        showToast('Failed to save transaction');
      }
    },
    [
      updateTransaction,
      createTransaction,
      onTransactionSave,
      setShowTransactionModal,
      setSelectedTransaction,
      showToast,
    ]
  );

  const handleTransactionCancel = useCallback(() => {
    setShowTransactionModal(false);
    setSelectedTransaction(undefined);
  }, [setShowTransactionModal, setSelectedTransaction]);

  return (
    <>
      {/* Transaction Form Modal */}
      <BaseModal
        title={selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}>
        <TransactionForm
          transaction={selectedTransaction}
          onSubmit={handleTransactionSubmit}
          onCancel={handleTransactionCancel}
        />
      </BaseModal>

      {/* Filter Modal */}
      <BaseModal title="Filter" visible={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <FilterForm
          filterState={filterState}
          setFilterState={setFilterState}
          presets={filterPresets}
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
    </>
  );
}
