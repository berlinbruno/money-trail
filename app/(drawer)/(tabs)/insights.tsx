import {
  BarChartSection,
  LineChartSection,
  PieChartSection,
  SmartInsightsSection,
} from '@/components/insights';
import { RANGE_OPTIONS } from '@/constants/insightsConstants';
import { useInsightManager } from '@/hooks/useInsightManager';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

// Main Page
export default function InsightsScreen() {
  const theme = useTheme();
  const {
    selectedRangeIndex,
    currentRangeKey,
    insightsData,
    handleRangeChange,
    handleRefresh,
    appState,
  } = useInsightManager();

  return (
    <View className="flex-1">
      <ScrollView
        className="p-2"
        refreshControl={
          <RefreshControl
            refreshing={appState.isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.background]}
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
        onChange={(e) => handleRangeChange(e.nativeEvent.selectedSegmentIndex)}
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
