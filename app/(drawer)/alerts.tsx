import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, RefreshControl, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import AlertCategoryCard from '@/components/alert/AlertCategoryCard';
import AlertForm from '@/components/alert/AlertForm';
import { Label } from '@/components/ui/label';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { ALERT_LABELS, ALERT_TYPE_FREQUENCY_MAP } from '@/constants/alertsConstants';
import {
  createAlert,
  deleteAlert,
  fetchAlertsByTypeAndFrequency,
  fetchTotalTransactionAmount,
  updateAlert,
} from '@/lib/db/alertQueries';
import { AlertFrequency, Alert as Alerts, AlertType, EditAlert, NewAlert } from '@/types/Alert';
import { TransactionCategory } from '@/types/Transaction';
import { calculateUsageRatio, formatPercentage } from '@/utils/alertUtils';

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

  const theme = useTheme();
  const db = useSQLiteContext();
  const screenWidth = Dimensions.get('window').width;
  const pieChartRadius = screenWidth / 5;

  // Calculates usage ratio for a list of alerts

  // Fetch alerts grouped by type and frequency, and attach current values
  const loadAlerts = useCallback(async () => {
    if (!db) return;

    setIsRefreshing(true);

    const incomeWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'weekly');
    const incomeMonthlyAlerts = await fetchAlertsByTypeAndFrequency(db, 'income', 'monthly');
    const spendingWeeklyAlerts = await fetchAlertsByTypeAndFrequency(db, 'spending', 'weekly');
    const spendingMonthlyAlerts = await fetchAlertsByTypeAndFrequency(db, 'spending', 'monthly');

    const incomeWeeklyCurrent = await fetchTotalTransactionAmount(db, 'credit', 'weekly');
    const incomeMonthlyCurrent = await fetchTotalTransactionAmount(db, 'credit', 'monthly');
    const spendingWeeklyCurrent = await fetchTotalTransactionAmount(db, 'debit', 'weekly');
    const spendingMonthlyCurrent = await fetchTotalTransactionAmount(db, 'debit', 'monthly');

    incomeWeeklyAlerts.forEach((alert) => (alert.current_value = incomeWeeklyCurrent));
    incomeMonthlyAlerts.forEach((alert) => (alert.current_value = incomeMonthlyCurrent));
    spendingWeeklyAlerts.forEach((alert) => (alert.current_value = spendingWeeklyCurrent));
    spendingMonthlyAlerts.forEach((alert) => (alert.current_value = spendingMonthlyCurrent));

    // Attach current_value to each alert
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

    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

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

  const handleDeleteAlert = (alertId: string) => {
    if (!alertId) return;

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAlert(db, alertId);
          loadAlerts();
        },
      },
    ]);
  };

  const handleSubmitAlert = async (alert: NewAlert | EditAlert) => {
    try {
      if ('id' in alert) {
        await updateAlert(db, {
          id: alert.id,
          category: alert.category,
          threshold: alert.threshold,
          updated_at: alert.updated_at,
        });
      } else {
        await createAlert(db, {
          type: alert.type,
          frequency: alert.frequency,
          category: alert.category,
          threshold: alert.threshold,
          created_at: alert.created_at,
        });
      }
      loadAlerts();
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save alert:', error);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsLoading(true);
    await loadAlerts();
    setIsLoading(false);
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
          />
        )}
      </BaseModal>
    </View>
  );
}

function setIsLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}
