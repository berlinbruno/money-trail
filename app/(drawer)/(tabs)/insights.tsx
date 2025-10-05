import {
  BarChartSection,
  LineChartSection,
  PieChartSection,
  SmartInsightsSection,
} from '@/components/insights';
import { RANGE_OPTIONS } from '@/constants/insightsConstants';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
import {
  fetchCategoryBreakdown,
  fetchIncomeExpenseTrend,
  fetchInsightsSummary,
} from '@/lib/database/insightQueries';
import { CategoryBreakdown, insightsDataset, InsightsSummary } from '@/types/Insight';
import { transformTimeSeries } from '@/utils/finance/insightsUtils';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

// Main Page
export default function InsightsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { state: appState, actions: appActions } = useApp();
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [insightsData, setInsightsData] = useState({
    insightsSummary: null as InsightsSummary | null,
    timeSeriesData: null as insightsDataset | null,
    categoryBreakdown: {
      income: [] as CategoryBreakdown[],
      expense: [] as CategoryBreakdown[],
    },
  });

  // Fetch all insights data
  const fetchInsightsData = useCallback(async () => {
    if (!db) return;
    try {
      const currentRange = RANGE_OPTIONS[selectedRangeIndex];
      const [categories, summary, trendData] = await Promise.all([
        fetchCategoryBreakdown(db, currentRange),
        fetchInsightsSummary(db, currentRange),
        fetchIncomeExpenseTrend(db, currentRange),
      ]);
      setInsightsData((prev) => ({
        ...prev,
        categoryBreakdown: {
          income: Array.isArray(categories.incomeCategories) ? categories.incomeCategories : [],
          expense: Array.isArray(categories.expenseCategories) ? categories.expenseCategories : [],
        },
        insightsSummary: summary,
        timeSeriesData: (() => {
          const updated: insightsDataset = {
            Weekly: prev.timeSeriesData?.Weekly ?? transformTimeSeries([]),
            Monthly: prev.timeSeriesData?.Monthly ?? transformTimeSeries([]),
            Yearly: prev.timeSeriesData?.Yearly ?? transformTimeSeries([]),
          };
          updated[currentRange] = transformTimeSeries(trendData);
          return updated;
        })(),
      }));
    } catch (error) {
      console.error('Error fetching insights data:', error);
      showToast('Unable to load insights data');
      setInsightsData((prev) => ({
        ...prev,
        categoryBreakdown: { income: [], expense: [] },
        insightsSummary: null,
        timeSeriesData: null,
      }));
    }
  }, [db, selectedRangeIndex, showToast]);

  // Fetch data when range changes
  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  // Refresh insights when transaction data changes or insights trigger changes
  useEffect(() => {
    fetchInsightsData();
  }, [appState.insightsUpdateTrigger, appState.transactionListTrigger, fetchInsightsData]);

  const onRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchInsightsData();
      // Mark insights as updated
      appActions.markInsightsUpdated();
      // Silent refresh - no toast needed for pull-to-refresh
    } catch (error) {
      console.error('Error refreshing insights:', error);
      showToast('Unable to refresh insights data');
    } finally {
      appActions.setRefreshing(false);
    }
  }, [fetchInsightsData, appActions, showToast]);

  const currentRangeKey = RANGE_OPTIONS[selectedRangeIndex];

  return (
    <View className="flex-1">
      <ScrollView
        className="p-2"
        refreshControl={
          <RefreshControl
            refreshing={appState.isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        <BarChartSection
          timeSeriesData={insightsData.timeSeriesData}
          rangeLabel={currentRangeKey}
        />
        <LineChartSection
          timeSeriesData={insightsData.timeSeriesData}
          rangeLabel={currentRangeKey}
        />
        <PieChartSection categoryBreakdown={insightsData.categoryBreakdown} />
        <SmartInsightsSection insightsSummary={insightsData.insightsSummary} />
      </ScrollView>
      <SegmentedControl
        values={RANGE_OPTIONS as unknown as string[]}
        selectedIndex={selectedRangeIndex}
        onChange={(e) => setSelectedRangeIndex(e.nativeEvent.selectedSegmentIndex)}
        style={{ margin: 8, borderRadius: 8 }}
        tintColor={theme.colors.primary}
        backgroundColor={theme.colors.background}
        fontStyle={{ color: theme.colors.text }}
        activeFontStyle={{
          color: theme.colors.background,
          fontWeight: '600',
        }}
      />
    </View>
  );
}
