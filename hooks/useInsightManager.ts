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
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface InsightManagerOptions {
  autoRefresh?: boolean;
  initialRangeIndex?: number;
}

interface InsightsData {
  insightsSummary: InsightsSummary | null;
  timeSeriesData: insightsDataset | null;
  categoryBreakdown: {
    income: CategoryBreakdown[];
    expense: CategoryBreakdown[];
  };
}

/**
 * Comprehensive insight management hook
 * Handles all insight operations, state, and data fetching
 */
export const useInsightManager = ({
  autoRefresh = true,
  initialRangeIndex = 0,
}: InsightManagerOptions = {}) => {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { state: appState, actions: appActions } = useApp();

  // Main state
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(initialRangeIndex);
  const [insightsData, setInsightsData] = useState<InsightsData>({
    insightsSummary: null,
    timeSeriesData: null,
    categoryBreakdown: {
      income: [],
      expense: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get current range key (memoized to prevent unnecessary recalculations)
  const currentRangeKey = useMemo(() => RANGE_OPTIONS[selectedRangeIndex], [selectedRangeIndex]);

  // Reset insights data to initial state (stabilized to prevent recreations)
  const resetInsightsData = useCallback(() => {
    setInsightsData({
      insightsSummary: null,
      timeSeriesData: null,
      categoryBreakdown: { income: [], expense: [] },
    });
  }, []); // No dependencies - this function is always the same

  // Fetch all insights data (optimized to prevent dashboard re-renders)
  const fetchInsightsData = useCallback(
    async (showLoading = false) => {
      if (!db) return;

      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const currentRange = RANGE_OPTIONS[selectedRangeIndex];
        const [categories, summary, trendData] = await Promise.all([
          fetchCategoryBreakdown(db, currentRange),
          fetchInsightsSummary(db, currentRange),
          fetchIncomeExpenseTrend(db, currentRange),
        ]);

        setInsightsData((prev) => {
          // Only update if data has actually changed
          const newCategoryBreakdown = {
            income: Array.isArray(categories.incomeCategories) ? categories.incomeCategories : [],
            expense: Array.isArray(categories.expenseCategories)
              ? categories.expenseCategories
              : [],
          };

          // Optimize time series data update
          const newTimeSeriesData: insightsDataset = {
            Weekly: prev.timeSeriesData?.Weekly ?? transformTimeSeries([]),
            Monthly: prev.timeSeriesData?.Monthly ?? transformTimeSeries([]),
            Yearly: prev.timeSeriesData?.Yearly ?? transformTimeSeries([]),
          };
          newTimeSeriesData[currentRange] = transformTimeSeries(trendData);

          return {
            ...prev,
            categoryBreakdown: newCategoryBreakdown,
            insightsSummary: summary,
            timeSeriesData: newTimeSeriesData,
          };
        });
      } catch (error) {
        console.error('Error fetching insights data:', error);
        if (showLoading) {
          showToast('Unable to load insights data');
        }
        // Inline reset to avoid dependency issues
        setInsightsData({
          insightsSummary: null,
          timeSeriesData: null,
          categoryBreakdown: { income: [], expense: [] },
        });
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [db, selectedRangeIndex, showToast] // Removed resetInsightsData to stabilize callback
  );

  // Handle range selection change
  const handleRangeChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < RANGE_OPTIONS.length) {
      setSelectedRangeIndex(newIndex);
    }
  }, []);

  // Handle manual refresh with loading state (optimized to prevent dashboard re-renders)
  const handleRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchInsightsData(false); // Silent refresh for pull-to-refresh
      // Only mark insights updated, don't trigger other updates
      appActions.markInsightsUpdated();
    } catch (error) {
      console.error('Error refreshing insights:', error);
      showToast('Unable to refresh insights data');
    } finally {
      appActions.setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appActions, showToast]); // Removed fetchInsightsData to prevent re-renders

  // Effect: Fetch data when range changes (optimized to prevent dependency cycles)
  useEffect(() => {
    fetchInsightsData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRangeIndex]); // Only depend on selectedRangeIndex, not fetchInsightsData

  // Effect: Auto-refresh when transaction data or insights trigger changes (prevent dashboard re-renders)
  useEffect(() => {
    if (autoRefresh) {
      fetchInsightsData(false); // Silent refresh when data changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appState.insightsUpdateTrigger,
    appState.transactionListTrigger,
    autoRefresh,
    // Removed fetchInsightsData to prevent dependency cycle
  ]);

  // Derived state: Check if insights have meaningful data (memoized to prevent recalculation)
  const hasInsightsData = useMemo(
    () =>
      Boolean(
        insightsData.insightsSummary &&
          (insightsData.insightsSummary.totalIncome > 0 ||
            insightsData.insightsSummary.totalExpense > 0 ||
            insightsData.categoryBreakdown.income.length > 0 ||
            insightsData.categoryBreakdown.expense.length > 0)
      ),
    [insightsData]
  );

  // Derived state: Check if time series data exists for current range (memoized)
  const hasTimeSeriesData = useMemo(
    () =>
      Boolean(
        insightsData.timeSeriesData &&
          insightsData.timeSeriesData[currentRangeKey] &&
          insightsData.timeSeriesData[currentRangeKey].labels.length > 0
      ),
    [insightsData.timeSeriesData, currentRangeKey]
  );

  // Return object optimized to prevent dashboard re-renders
  return {
    // State
    selectedRangeIndex,
    currentRangeKey,
    insightsData,
    isLoading,

    // Derived state
    hasInsightsData,
    hasTimeSeriesData,

    // Operations
    fetchInsightsData,
    handleRangeChange,
    handleRefresh,
    resetInsightsData,

    // Only include minimal app state needed for refresh control
    appState: {
      isRefreshing: appState.isRefreshing,
    },
  };
};
