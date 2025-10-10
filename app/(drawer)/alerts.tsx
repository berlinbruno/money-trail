import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Dimensions, FlatList, RefreshControl, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { AlertCategoryCard, AlertForm } from '@/components/alert';
import { Label } from '@/components/ui/label';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { ALERT_LABELS } from '@/constants/alertsConstants';
import { useAlertManager } from '@/hooks/useAlertManager';
import { formatPercentage } from '@/utils/finance/alertUtils';

export default function AlertDashboardScreen() {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const pieChartRadius = screenWidth / 5;

  // Use the comprehensive alert manager hook
  const {
    alertsGroupedByCategory,
    expandedCategoryKey,
    modalVisible,
    isFormSubmitting,
    availableAlertCategories,
    currentAlertTypeFrequency,
    selectedAlert,
    spendingUsageRatio,
    incomeUsageRatio,
    handleAddAlert,
    handleEditAlert,
    handleDeleteAlert,
    handleSubmitAlert,
    toggleCategoryExpansion,
    closeModal,
    handleRefresh,
    appState,
  } = useAlertManager();

  return (
    <View className="flex-1">
      <FlatList
        data={Object.keys(ALERT_LABELS)}
        keyExtractor={(key) => key}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={appState.isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.background]}
            tintColor={theme.colors.primary}
          />
        }
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
            onToggleExpand={toggleCategoryExpansion}
            onAddAlert={handleAddAlert}
            onEditAlert={handleEditAlert}
            onDeleteAlert={handleDeleteAlert}
          />
        )}
      />
      <BaseModal
        title={selectedAlert ? 'Edit Alert' : 'Add Alert'}
        visible={modalVisible}
        onClose={closeModal}>
        {currentAlertTypeFrequency && availableAlertCategories && (
          <AlertForm
            alert={selectedAlert}
            availableCategories={availableAlertCategories}
            currentAlertTypeFrequency={currentAlertTypeFrequency}
            onSubmit={handleSubmitAlert}
            onClose={closeModal}
            isLoading={isFormSubmitting}
          />
        )}
      </BaseModal>
    </View>
  );
}
