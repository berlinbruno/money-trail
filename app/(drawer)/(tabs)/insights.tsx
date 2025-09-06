import BarChartSection from '@/components/insights/BarChartSection';
import LineChartSection from '@/components/insights/LineChartSection';
import PieChartSection from '@/components/insights/PieChartSection';
import SmartInsightsSection from '@/components/insights/SmartInsightsSection';
import { RANGE_OPTIONS } from '@/constants/insightsConstants';
import {
  fetchCategoryBreakdown,
  fetchIncomeExpenseTrend,
  fetchInsightsSummary,
} from '@/lib/db/insightQueries';
import { CategoryBreakdown, insightsDataset, InsightsSummary } from '@/types/Insight';
import { transformTimeSeries } from '@/utils/insightsUtils';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

// Main Page
export default function InsightsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [state, setState] = useState({
    insightsSummary: null as InsightsSummary | null,
    timeSeriesData: null as insightsDataset | null,
    categoryBreakdown: {
      income: [] as CategoryBreakdown[],
      expense: [] as CategoryBreakdown[],
    },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all data in main page
  const fetchInsightsData = useCallback(async () => {
    if (!db) return;
    setState((prev) => ({
      ...prev,
    }));
    try {
      const currentRange = RANGE_OPTIONS[selectedRangeIndex];
      const [categories, summary, trendData] = await Promise.all([
        fetchCategoryBreakdown(db, currentRange),
        fetchInsightsSummary(db, currentRange),
        fetchIncomeExpenseTrend(db, currentRange),
      ]);
      setState((prev) => ({
        ...prev,
        categoryBreakdown: {
          income: Array.isArray(categories.incomeCategories) ? categories.incomeCategories : [],
          expense: Array.isArray(categories.expenseCategories) ? categories.expenseCategories : [],
        },
        insightsSummary: summary,
        timeSeriesData: (() => {
          const updated: insightsDataset = {
            Daily: prev.timeSeriesData?.Daily ?? transformTimeSeries([]),
            Weekly: prev.timeSeriesData?.Weekly ?? transformTimeSeries([]),
            Monthly: prev.timeSeriesData?.Monthly ?? transformTimeSeries([]),
            Yearly: prev.timeSeriesData?.Yearly ?? transformTimeSeries([]),
          };
          updated[currentRange] = transformTimeSeries(trendData);
          return updated;
        })(),
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        categoryBreakdown: { income: [], expense: [] },
        insightsSummary: null,
        timeSeriesData: null,
      }));
    }
  }, [db, selectedRangeIndex]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      fetchInsightsData();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchInsightsData]);

  const currentRangeKey = RANGE_OPTIONS[selectedRangeIndex];

  return (
    <View className="flex-1">
      <ScrollView
        className="p-2"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        <BarChartSection timeSeriesData={state.timeSeriesData} rangeLabel={currentRangeKey} />
        <LineChartSection timeSeriesData={state.timeSeriesData} rangeLabel={currentRangeKey} />
        <PieChartSection categoryBreakdown={state.categoryBreakdown} />
        <SmartInsightsSection insightsSummary={state.insightsSummary} />
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
          color: theme.dark ? theme.colors.background : theme.colors.primary,
          fontWeight: '600',
        }}
      />
    </View>
  );
}
