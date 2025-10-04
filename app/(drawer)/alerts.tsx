import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { AlertCategoryCard, AlertForm } from '@/components/alert';
import { Label } from '@/components/ui/label';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { ALERT_LABELS, ALERT_TYPE_FREQUENCY_MAP } from '@/constants/alertsConstants';
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  createAlert,
  deleteAlert,
  fetchAlertsByTypeAndFrequency,
  fetchTotalTransactionAmount,
  updateAlert,
} from '@/lib/database/alertQueries';
import { AlertFrequency, Alert as Alerts, AlertType, EditAlert, NewAlert } from '@/types/Alert';
import { TransactionCategory } from '@/types/Transaction';
import { calculateUsageRatio, formatPercentage } from '@/utils/finance/alertUtils';

export default function AlertDashboardScreen() {
  const [alertsGroupedByCategory, setAlertsGroupedByCategory] = useState<Record<string, Alerts[]>>({
    'income-weekly': [],
    'income-monthly': [],
    'spending-weekly': [],
    'spending-monthly': [],
  });
  const [availableAlertCategories, setAvailableAlertCategories] = useState<TransactionCategory[]>();
  const [expandedCategoryKey, setExpandedCategoryKey] = useState<string | null>(null);
  const [currentAlertTypeFrequency, setCurrentAlertTypeFrequency] = useState<{
    type: AlertType;
    frequency: AlertFrequency;
  }>();
  const [selectedAlert, setSelectedAlert] = useState<Alerts>();
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const theme = useTheme();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const screenWidth = Dimensions.get('window').width;
  const pieChartRadius = screenWidth / 5;

  // Calculates usage ratio for a list of alerts

  // Fetch alerts grouped by type and frequency, and attach current values
  const loadAlerts = useCallback(
    async (showLoader = true) => {
      if (!db) return;

      if (showLoader) setIsRefreshing(true);

      try {
        const incomeWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'weekly');
        const incomeMonthlyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'monthly');
        const spendingWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'spending', 'weekly');
        const spendingMonthlyAlerts = await fetchAlertsByTypeAndFrequency(
          db,
          'spending',
          'monthly'
        );

        const incomeWeeklyCurrent = await fetchTotalTransactionAmount(db, 'credit', 'weekly');
        const incomeMonthlyCurrent = await fetchTotalTransactionAmount(db, 'credit', 'monthly');
        const spendingWeeklyCurrent = await fetchTotalTransactionAmount(db, 'debit', 'weekly');
        const spendingMonthlyCurrent = await fetchTotalTransactionAmount(db, 'debit', 'monthly');

        incomeWeeklyAlerts.forEach((alert) => (alert.current_value = incomeWeeklyCurrent));
        incomeMonthlyAlerts.forEach((alert) => (alert.current_value = incomeMonthlyCurrent));
        spendingWeeklyAlerts.forEach((alert) => (alert.current_value = spendingWeeklyCurrent));
        spendingMonthlyAlerts.forEach((alert) => (alert.current_value = spendingMonthlyCurrent));

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
        if (showLoader) setIsRefreshing(false);
      }
    },
    [db, showToast]
  );

  // Load alerts on mount
  useEffect(() => {
    loadAlerts(false); // Silent initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Safe to disable - we only want this to run once on mount

  // Handlers for add, edit, delete alerts
  const handleAddAlert = (categoryKey: string, categories: TransactionCategory[]) => {
    setAvailableAlertCategories(categories);
    setCurrentAlertTypeFrequency(ALERT_TYPE_FREQUENCY_MAP[categoryKey]);
    setSelectedAlert(undefined);
    setModalVisible(true);
  };

  const handleEditAlert = (alert: Alerts, categories: TransactionCategory[]) => {
    setAvailableAlertCategories(categories);
    setSelectedAlert(alert);
    setModalVisible(true);
  };

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
            showToast('Alert deleted successfully');
          } catch (error) {
            console.error('Failed to delete alert:', error);
            showToast('Failed to delete alert');
            throw error; // Let the dialog handle the error state
          }
        },
      });
    },
    [db, loadAlerts, showToast, showConfirmationDialog]
  );

  const handleSubmitAlert = async (alert: NewAlert | EditAlert) => {
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
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save alert:', error);
      showToast('Failed to save alert');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await loadAlerts(true); // Show loading for manual refresh
    // Silent refresh - no toast needed for pull-to-refresh
  };

  // Derived data: calculate usage for spending and income alerts
  const spendingUsageRatio = calculateUsageRatio(
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
  );

  const incomeUsageRatio = calculateUsageRatio(
    [...alertsGroupedByCategory['income-weekly'], ...alertsGroupedByCategory['income-monthly']].map(
      (alert) => ({
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
      })
    )
  );

  return (
    <View className="flex-1">
      <FlatList
        data={Object.keys(ALERT_LABELS)}
        keyExtractor={(key) => key}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View className="flex-row justify-center space-x-6 p-4">
            <View className="flex-1 items-center">
              <PieChart
                donut
                semiCircle
                radius={pieChartRadius}
                innerRadius={pieChartRadius - 15}
                innerCircleColor={theme.colors.background}
                data={[
                  { value: spendingUsageRatio, color: '#FF3B30' },
                  { value: 1 - spendingUsageRatio, color: '#E0E0E0' },
                ]}
                centerLabelComponent={() => <Label>{formatPercentage(spendingUsageRatio)}</Label>}
              />
              <Text>Spending Usage</Text>
            </View>

            <View className="flex-1 items-center">
              <PieChart
                donut
                semiCircle
                radius={pieChartRadius}
                innerRadius={pieChartRadius - 15}
                innerCircleColor={theme.colors.background}
                data={[
                  { value: incomeUsageRatio, color: '#007AFF' },
                  { value: 1 - incomeUsageRatio, color: '#E0E0E0' },
                ]}
                centerLabelComponent={() => <Label>{formatPercentage(incomeUsageRatio)}</Label>}
                isAnimated
                animationDuration={500}
              />
              <Text>Income Usage</Text>
            </View>
          </View>
        }
        renderItem={({ item: categoryKey }) => (
          <AlertCategoryCard
            categoryKey={categoryKey}
            label={ALERT_LABELS[categoryKey]}
            alerts={alertsGroupedByCategory[categoryKey] || []}
            expanded={expandedCategoryKey === categoryKey}
            onToggleExpand={(key) =>
              setExpandedCategoryKey(expandedCategoryKey === key ? null : key)
            }
            onAddAlert={handleAddAlert}
            onEditAlert={handleEditAlert}
            onDeleteAlert={handleDeleteAlert}
          />
        )}
      />
      <BaseModal
        title={selectedAlert ? 'Edit Alert' : 'Add Alert'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}>
        {currentAlertTypeFrequency && availableAlertCategories && (
          <AlertForm
            alert={selectedAlert}
            availableCategories={availableAlertCategories}
            currentAlertTypeFrequency={currentAlertTypeFrequency}
            onSubmit={handleSubmitAlert}
            onClose={() => setModalVisible(false)}
            isLoading={isFormSubmitting}
          />
        )}
      </BaseModal>
    </View>
  );
}
