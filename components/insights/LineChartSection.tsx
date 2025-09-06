import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ANIMATION_DURATION,
  NO_OF_SECTIONS,
  SEGMENTS,
  TREND_COLORS,
} from '@/constants/insightsConstants';
import { formatAmount } from '@/utils/formatters';
import {
  calculateStep,
  calculateTotals,
  generateYAxisLabels,
  getTrendLineData,
} from '@/utils/insightsUtils';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { insightsDataset } from '@/types/Insight';
import { Separator } from '../ui/separator';
import { Text } from '../ui/text';
import { BarChartSkeleton } from './InsightSkeleton';
import { LegendRow } from './LegendRow';

interface LineChartSectionProps {
  timeSeriesData: insightsDataset | null;
  rangeLabel: keyof insightsDataset;
}

interface ChartDataPoint {
  dataPointText: string;
  value: number;
  label: string;
}

/**
 * Line chart component for comparing current and previous financial periods
 */
export default function LineChartSection({ timeSeriesData, rangeLabel }: LineChartSectionProps) {
  const theme = useTheme();

  // Segment control state
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const selectedSegment = useMemo(
    () => SEGMENTS[selectedSegmentIndex].toLowerCase() as 'income' | 'expense' | 'saving',
    [selectedSegmentIndex]
  );

  // Process data with memoization to avoid redundant calculations
  const trendLineData = useMemo(
    () => getTrendLineData(timeSeriesData, rangeLabel),
    [timeSeriesData, rangeLabel]
  );

  // Calculate totals just once
  const totals = useMemo(
    () => calculateTotals(timeSeriesData, rangeLabel),
    [timeSeriesData, rangeLabel]
  );

  // Get axis values based on selected segment (memoized)
  const axisValues = useMemo(() => {
    const {
      maxIncome,
      maxExpense,
      maxSavings,
      maxPreviousIncome,
      maxPreviousExpense,
      maxPreviousSavings,
    } = totals;

    switch (selectedSegment) {
      case 'income':
        return [maxIncome, maxPreviousIncome];
      case 'expense':
        return [maxExpense, maxPreviousExpense];
      default:
        return [maxSavings, maxPreviousSavings];
    }
  }, [selectedSegment, totals]);

  // Memoize derived chart configuration
  const chartConfig = useMemo(() => {
    const totalTrendValue = axisValues.reduce((sum, v) => sum + v, 0);
    const stepValue = calculateStep(axisValues, NO_OF_SECTIONS);
    const { labels, sectionsNeeded } = generateYAxisLabels(axisValues, NO_OF_SECTIONS);

    return { totalTrendValue, stepValue, labels, sectionsNeeded };
  }, [axisValues]);

  // State for focused label
  const [focusedLabel, setFocusedLabel] = useState<ChartDataPoint | null>(null);

  // Memoize chart colors to prevent re-renders
  const chartColors = useMemo(() => {
    switch (selectedSegment) {
      case 'income':
        return {
          color1: TREND_COLORS.income,
          color2: TREND_COLORS.prevIncome,
        };
      case 'expense':
        return {
          color1: TREND_COLORS.expense,
          color2: TREND_COLORS.prevExpense,
        };
      default:
        return {
          color1: TREND_COLORS.saving,
          color2: TREND_COLORS.prevSaving,
        };
    }
  }, [selectedSegment]);

  // Build legend config when label is focused
  const legendConfig = useMemo(() => {
    if (!focusedLabel || !trendLineData) return [];

    const labelValue = focusedLabel.label;
    const findValue = (dataArray: any[]) =>
      formatAmount(dataArray?.find((item) => item.label === labelValue)?.value ?? 0);

    if (selectedSegment === 'income') {
      return [
        {
          color: TREND_COLORS.income,
          label: 'Income',
          value: findValue(trendLineData.incomes),
        },
        {
          color: TREND_COLORS.prevIncome,
          label: 'Prev Income',
          value: findValue(trendLineData.previousIncomes),
        },
      ];
    } else if (selectedSegment === 'expense') {
      return [
        {
          color: TREND_COLORS.expense,
          label: 'Expense',
          value: findValue(trendLineData.expenses),
        },
        {
          color: TREND_COLORS.prevExpense,
          label: 'Prev Expense',
          value: findValue(trendLineData.previousExpenses),
        },
      ];
    } else {
      return [
        {
          color: TREND_COLORS.saving,
          label: 'Saving',
          value: findValue(trendLineData.savings),
        },
        {
          color: TREND_COLORS.prevSaving,
          label: 'Prev Saving',
          value: findValue(trendLineData.previousSavings),
        },
      ];
    }
  }, [focusedLabel, selectedSegment, trendLineData]);

  // Handle segment change
  const handleSegmentChange = useCallback(
    (e: { nativeEvent: { selectedSegmentIndex: number } }) => {
      setSelectedSegmentIndex(e.nativeEvent.selectedSegmentIndex);
      setFocusedLabel(null); // Reset focus when changing segments
    },
    []
  );

  // Handle chart focus
  const handleChartFocus = useCallback((item: ChartDataPoint) => {
    setFocusedLabel(item);
  }, []);

  // Get appropriate data based on selected segment
  const primaryData = useMemo(() => {
    if (!trendLineData) return [];
    return selectedSegment === 'income'
      ? trendLineData.incomes
      : selectedSegment === 'expense'
        ? trendLineData.expenses
        : trendLineData.savings;
  }, [selectedSegment, trendLineData]);

  const secondaryData = useMemo(() => {
    if (!trendLineData) return [];
    return selectedSegment === 'income'
      ? trendLineData.previousIncomes
      : selectedSegment === 'expense'
        ? trendLineData.previousExpenses
        : trendLineData.previousSavings;
  }, [selectedSegment, trendLineData]);

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>This Period vs Last Period</CardTitle>
        <SegmentedControl
          values={SEGMENTS as unknown as string[]}
          selectedIndex={selectedSegmentIndex}
          onChange={handleSegmentChange}
          style={{ margin: 8, borderRadius: 8 }}
          tintColor={theme.colors.primary}
          backgroundColor={theme.colors.background}
          fontStyle={{ color: theme.colors.text }}
          activeFontStyle={{
            color: theme.dark ? '#000' : '#fff',
            fontWeight: '600',
          }}
        />

        {/* Focused value and legend under segmented control */}
        {focusedLabel && (
          <View className="mb-2 mt-2 flex w-full flex-row items-center justify-between gap-2">
            <View className="flex flex-col">
              {legendConfig.map((row) => (
                <LegendRow key={row.label} color={row.color} label={row.label} value={row.value} />
              ))}
            </View>
            <View className="flex h-full min-w-12 flex-row items-center justify-between gap-2">
              <Separator orientation="vertical" />
              <Text variant={'h4'}>{focusedLabel.label}</Text>
            </View>
          </View>
        )}
      </CardHeader>

      {chartConfig.totalTrendValue > 0 ? (
        <CardFooter className="px-2">
          <LineChart
            overflowBottom={0}
            mostNegativeValue={0}
            negativeStepValue={0}
            data={primaryData}
            data2={secondaryData}
            curved
            spacing={100}
            startFillColor1={chartColors.color1}
            startFillColor2={chartColors.color2}
            startOpacity={0.8}
            endFillColor1={chartColors.color1}
            endFillColor2={chartColors.color2}
            endOpacity={0.3}
            areaChart
            hideRules
            hideDataPoints
            focusEnabled
            onFocus={handleChartFocus}
            color1={chartColors.color1}
            color2={chartColors.color2}
            stepValue={chartConfig.stepValue}
            noOfSections={chartConfig.sectionsNeeded}
            yAxisLabelTexts={chartConfig.labels}
            yAxisLabelWidth={40}
            yAxisTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            isAnimated
            animationDuration={ANIMATION_DURATION}
            animateOnDataChange
          />
        </CardFooter>
      ) : (
        <BarChartSkeleton />
      )}
    </Card>
  );
}
