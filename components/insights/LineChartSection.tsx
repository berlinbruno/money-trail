import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount } from '@/utils/formatters';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  ANIMATION_DURATION,
  NO_OF_SECTIONS,
  SEGMENTS,
  TREND_COLORS,
} from '../../constants/insightsConstants';
import {
  calculateStep,
  calculateTotals,
  generateYAxisLabels,
  getTrendLineData,
} from '../../utils/insightsUtils';

import { insightsDataset } from '@/types/Insight';
import { LegendRow } from './LegendRow';

interface LineChartSectionProps {
  timeSeriesData: insightsDataset | null;
  rangeLabel: keyof insightsDataset;
}

export default function LineChartSection({ timeSeriesData, rangeLabel }: LineChartSectionProps) {
  const theme = useTheme();

  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const selectedSegment = SEGMENTS[selectedSegmentIndex].toLowerCase() as
    | 'income'
    | 'expense'
    | 'saving';

  // Trend data
  const trendLineData = useMemo(
    () => getTrendLineData(timeSeriesData, rangeLabel),
    [timeSeriesData, rangeLabel]
  );

  // Totals + max values
  const {
    maxIncome,
    maxExpense,
    maxSavings,
    maxPreviousIncome,
    maxPreviousExpense,
    maxPreviousSavings,
  } = useMemo(() => calculateTotals(timeSeriesData, rangeLabel), [timeSeriesData, rangeLabel]);

  // Axis values based on selected segment
  const axisValues = useMemo(() => {
    switch (selectedSegment) {
      case 'income':
        return [maxIncome, maxPreviousIncome];
      case 'expense':
        return [maxExpense, maxPreviousExpense];
      default:
        return [maxSavings, maxPreviousSavings];
    }
  }, [
    selectedSegment,
    maxIncome,
    maxExpense,
    maxSavings,
    maxPreviousIncome,
    maxPreviousExpense,
    maxPreviousSavings,
  ]);

  // Derived chart configs
  const totalTrendValue = useMemo(() => axisValues.reduce((sum, v) => sum + v, 0), [axisValues]);

  const stepValue = useMemo(() => calculateStep(axisValues, NO_OF_SECTIONS), [axisValues]);

  const yAxisLabelTexts = useMemo(
    () => generateYAxisLabels(axisValues, NO_OF_SECTIONS),
    [axisValues]
  );

  // State for focused label
  const [focusedLabel, setFocusedLabel] = useState<null | {
    dataPointText: string;
    value: number;
    label: string;
  }>(null);
  // Helper to get chart colors by segment
  const getChartColors = (segment: typeof selectedSegment) => {
    switch (segment) {
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
  };

  // Memoize legend config
  const legendConfig = useMemo(() => {
    if (!focusedLabel) return [];
    if (selectedSegment === 'income') {
      return [
        {
          color: TREND_COLORS.income,
          label: 'Income',
          value: formatAmount(
            trendLineData?.incomes.find((item) => item.label === focusedLabel.label)?.value ?? 0
          ),
        },
        {
          color: TREND_COLORS.prevIncome,
          label: 'Prev Income',
          value: formatAmount(
            trendLineData?.previousIncomes.find((item) => item.label === focusedLabel.label)
              ?.value ?? 0
          ),
        },
      ];
    } else if (selectedSegment === 'expense') {
      return [
        {
          color: TREND_COLORS.expense,
          label: 'Expense',
          value: formatAmount(
            trendLineData?.expenses.find((item) => item.label === focusedLabel.label)?.value ?? 0
          ),
        },
        {
          color: TREND_COLORS.prevExpense,
          label: 'Prev Expense',
          value: formatAmount(
            trendLineData?.previousExpenses.find((item) => item.label === focusedLabel.label)
              ?.value ?? 0
          ),
        },
      ];
    } else {
      return [
        {
          color: TREND_COLORS.saving,
          label: 'Saving',
          value: formatAmount(
            trendLineData?.savings.find((item) => item.label === focusedLabel.label)?.value ?? 0
          ),
        },
        {
          color: TREND_COLORS.prevSaving,
          label: 'Prev Saving',
          value: formatAmount(
            trendLineData?.previousSavings.find((item) => item.label === focusedLabel.label)
              ?.value ?? 0
          ),
        },
      ];
    }
  }, [focusedLabel, selectedSegment, trendLineData]);

  const chartColors = getChartColors(selectedSegment);

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>This Period vs Last Period</CardTitle>
        <SegmentedControl
          values={SEGMENTS as unknown as string[]}
          selectedIndex={selectedSegmentIndex}
          onChange={(e) => setSelectedSegmentIndex(e.nativeEvent.selectedSegmentIndex)}
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
          <View className="mb-2 mt-2 flex flex-col items-center gap-2">
            <View className="flex w-full flex-col">
              {legendConfig.map((row) => (
                <LegendRow key={row.label} color={row.color} label={row.label} value={row.value} />
              ))}
            </View>
          </View>
        )}
      </CardHeader>

      {totalTrendValue > 0 ? (
        <CardFooter>
          <LineChart
            overflowBottom={0}
            mostNegativeValue={0}
            negativeStepValue={0}
            data={
              selectedSegment === 'income'
                ? (trendLineData?.incomes ?? [])
                : selectedSegment === 'expense'
                  ? (trendLineData?.expenses ?? [])
                  : (trendLineData?.savings ?? [])
            }
            data2={
              selectedSegment === 'income'
                ? (trendLineData?.previousIncomes ?? [])
                : selectedSegment === 'expense'
                  ? (trendLineData?.previousExpenses ?? [])
                  : (trendLineData?.previousSavings ?? [])
            }
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
            onFocus={(item: { dataPointText: string; value: number; label: string }) => {
              setFocusedLabel(item);
            }}
            color1={chartColors.color1}
            color2={chartColors.color2}
            stepValue={stepValue}
            noOfSections={NO_OF_SECTIONS}
            yAxisLabelTexts={yAxisLabelTexts}
            yAxisLabelWidth={50}
            yAxisTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            isAnimated
            animationDuration={ANIMATION_DURATION}
            animateOnDataChange
          />
        </CardFooter>
      ) : (
        <View className="p-6">
          <Skeleton className={'h-56 rounded-lg'} />
        </View>
      )}
    </Card>
  );
}
