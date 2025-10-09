import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  createAlert,
  deleteAlert,
  fetchAlertsByTypeAndFrequency,
  fetchTransactionAmountByCategory,
  updateAlert,
} from '@/lib/database/alertQueries';
import { AlertFrequency, Alert as Alerts, AlertType, EditAlert, NewAlert } from '@/types/Alert';
import { TransactionCategory } from '@/types/Transaction';
import { calculateUsageRatio } from '@/utils/finance/alertUtils';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AlertManagerOptions {
  autoRefresh?: boolean;
}

/**
 * Comprehensive alert management hook
 * Handles all alert operations, state, and UI interactions
 */
export const useAlertManager = ({ autoRefresh = true }: AlertManagerOptions = {}) => {
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const { state: appState, actions: appActions } = useApp();
  const db = useSQLiteContext();

  // Main alert state
  const [alertsGroupedByCategory, setAlertsGroupedByCategory] = useState<Record<string, Alerts[]>>({
    'income-weekly': [],
    'income-monthly': [],
    'spending-weekly': [],
    'spending-monthly': [],
  });

  // UI state
  const [expandedCategoryKey, setExpandedCategoryKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Modal form state
  const [availableAlertCategories, setAvailableAlertCategories] = useState<TransactionCategory[]>();
  const [currentAlertTypeFrequency, setCurrentAlertTypeFrequency] = useState<{
    type: AlertType;
    frequency: AlertFrequency;
  }>();
  const [selectedAlert, setSelectedAlert] = useState<Alerts>();

  // Fetch alerts grouped by type and frequency, and attach current values
  const loadAlerts = useCallback(
    async (showLoader = true) => {
      if (!db) return;

      if (showLoader) appActions.setRefreshing(true);

      try {
        const incomeWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'weekly');
        const incomeMonthlyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'monthly');
        const spendingWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'spending', 'weekly');
        const spendingMonthlyAlerts = await fetchAlertsByTypeAndFrequency(
          db,
          'spending',
          'monthly'
        );

        // Fetch category-specific current values for each alert
        for (const alert of incomeWeeklyAlerts) {
          alert.current_value = await fetchTransactionAmountByCategory(
            db,
            'credit',
            alert.category,
            'weekly'
          );
        }

        for (const alert of incomeMonthlyAlerts) {
          alert.current_value = await fetchTransactionAmountByCategory(
            db,
            'credit',
            alert.category,
            'monthly'
          );
        }

        for (const alert of spendingWeeklyAlerts) {
          alert.current_value = await fetchTransactionAmountByCategory(
            db,
            'debit',
            alert.category,
            'weekly'
          );
        }

        for (const alert of spendingMonthlyAlerts) {
          alert.current_value = await fetchTransactionAmountByCategory(
            db,
            'debit',
            alert.category,
            'monthly'
          );
        }

        setAlertsGroupedByCategory({
          'income-weekly': incomeWeeklyAlerts,
          'income-monthly': incomeMonthlyAlerts,
          'spending-weekly': spendingWeeklyAlerts,
          'spending-monthly': spendingMonthlyAlerts,
        });
      } catch (error) {
        console.error('Error loading alerts:', error);
        showToast('Failed to load alerts data');
      } finally {
        if (showLoader) appActions.setRefreshing(false);
      }
    },
    [db, showToast, appActions]
  );

  // Alert CRUD operations
  const handleAddAlert = useCallback((categoryKey: string, categories: TransactionCategory[]) => {
    const ALERT_TYPE_FREQUENCY_MAP: Record<string, { type: AlertType; frequency: AlertFrequency }> =
      {
        'income-weekly': { type: 'income', frequency: 'weekly' },
        'income-monthly': { type: 'income', frequency: 'monthly' },
        'spending-weekly': { type: 'spending', frequency: 'weekly' },
        'spending-monthly': { type: 'spending', frequency: 'monthly' },
      };

    setAvailableAlertCategories(categories);
    setCurrentAlertTypeFrequency(ALERT_TYPE_FREQUENCY_MAP[categoryKey]);
    setSelectedAlert(undefined);
    setModalVisible(true);
  }, []);

  const handleEditAlert = useCallback((alert: Alerts, categories: TransactionCategory[]) => {
    setAvailableAlertCategories(categories);
    setSelectedAlert(alert);
    setModalVisible(true);
  }, []);

  const handleDeleteAlert = useCallback(
    (alertId: string) => {
      if (!alertId) return;

      showConfirmationDialog({
        title: 'Delete Alert',
        description: 'Are you sure you want to delete this alert? This action cannot be undone.',
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting...',
        onConfirm: async () => {
          try {
            await deleteAlert(db, alertId);
            await loadAlerts(false); // Silent refresh
            appActions.triggerAlertsRefresh(); // Trigger alerts update for other components
            showToast('Alert deleted successfully');
          } catch (error) {
            console.error('Failed to delete alert:', error);
            showToast('Failed to delete alert');
            throw error; // Let the dialog handle the error state
          }
        },
      });
    },
    [db, loadAlerts, showToast, showConfirmationDialog, appActions]
  );

  const handleSubmitAlert = useCallback(
    async (alert: NewAlert | EditAlert) => {
      setIsFormSubmitting(true);
      try {
        if ('id' in alert) {
          await updateAlert(db, {
            id: alert.id,
            category: alert.category,
            threshold: alert.threshold,
            updated_at: alert.updated_at,
          });
          showToast('Alert updated');
        } else {
          await createAlert(db, {
            type: alert.type,
            frequency: alert.frequency,
            category: alert.category,
            threshold: alert.threshold,
            created_at: alert.created_at,
          });
          showToast('Alert created');
        }
        await loadAlerts(false); // Silent refresh
        appActions.triggerAlertsRefresh(); // Trigger alerts update for other components
        setModalVisible(false);
      } catch (error) {
        console.error('Failed to save alert:', error);
        showToast('Failed to save alert');
      } finally {
        setIsFormSubmitting(false);
      }
    },
    [db, loadAlerts, showToast, appActions]
  );

  // UI helpers
  const toggleCategoryExpansion = useCallback((key: string) => {
    setExpandedCategoryKey((prev) => (prev === key ? null : key));
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedAlert(undefined);
  }, []);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await loadAlerts(true); // Show loading for manual refresh
  }, [loadAlerts]);

  // Derived data: calculate usage for spending and income alerts
  const spendingUsageRatio = useMemo(
    () =>
      calculateUsageRatio(
        [
          ...alertsGroupedByCategory['spending-weekly'],
          ...alertsGroupedByCategory['spending-monthly'],
        ].map((alert) => ({
          id: alert.id,
          type: alert.type,
          category: alert.category,
          threshold: alert.threshold,
          progress:
            typeof alert.current_value === 'number' &&
            typeof alert.threshold === 'number' &&
            alert.threshold > 0
              ? Math.min(alert.current_value / alert.threshold, 1)
              : 0,
        }))
      ),
    [alertsGroupedByCategory]
  );

  const incomeUsageRatio = useMemo(
    () =>
      calculateUsageRatio(
        [
          ...alertsGroupedByCategory['income-weekly'],
          ...alertsGroupedByCategory['income-monthly'],
        ].map((alert) => ({
          id: alert.id,
          type: alert.type,
          category: alert.category,
          threshold: alert.threshold,
          progress:
            typeof alert.current_value === 'number' &&
            typeof alert.threshold === 'number' &&
            alert.threshold > 0
              ? Math.min(alert.current_value / alert.threshold, 1)
              : 0,
        }))
      ),
    [alertsGroupedByCategory]
  );

  // Load alerts on mount
  useEffect(() => {
    loadAlerts(false); // Silent initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Safe to disable - we only want this to run once on mount

  // Refresh alerts when transaction data or alerts trigger changes
  useEffect(() => {
    if (autoRefresh) {
      loadAlerts(false); // Silent refresh when data changes
    }
  }, [appState.transactionListTrigger, appState.alertsUpdateTrigger, loadAlerts, autoRefresh]);

  return {
    // State
    alertsGroupedByCategory,
    expandedCategoryKey,
    modalVisible,
    isFormSubmitting,

    // Modal form state
    availableAlertCategories,
    currentAlertTypeFrequency,
    selectedAlert,

    // Derived data
    spendingUsageRatio,
    incomeUsageRatio,

    // Operations
    loadAlerts,
    handleAddAlert,
    handleEditAlert,
    handleDeleteAlert,
    handleSubmitAlert,

    // UI helpers
    toggleCategoryExpansion,
    closeModal,
    handleRefresh,

    // App state
    appState,
  };
};
