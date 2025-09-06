import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ANIMATION_DURATION,
  BAR_COLORS,
  BAR_SPACING,
  BAR_WIDTH,
  NO_OF_SECTIONS,
} from '@/constants/insightsConstants';
import { insightsDataset } from '@/types/Insight';
import { formatAmount } from '@/utils/formatters';
import {
  calculateStep,
  calculateTotals,
  generateYAxisLabels,
  getBarChartData,
} from '@/utils/insightsUtils';
import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from '../ui/text';
import { BarChartSkeleton } from './InsightSkeleton';

interface BarChartSectionProps {
  timeSeriesData: insightsDataset | null;
  rangeLabel: keyof insightsDataset;
}

/**
 * Bar chart visualization component for financial data comparison
 */
export default function BarChartSection({ timeSeriesData, rangeLabel }: BarChartSectionProps) {
  const theme = useTheme();

  // Memoize calculations to optimize performance
  const chartData = useMemo(() => {
    // Get chart data and calculate necessary values
    const totals = calculateTotals(timeSeriesData, rangeLabel);
    const { maxIncome, maxExpense, maxSavings } = totals;
    const values = [maxIncome, maxExpense, maxSavings];

    // Calculate chart configuration
    const totalBarValue = values.reduce((sum, v) => sum + v, 0);
    const barChartData = getBarChartData(timeSeriesData, rangeLabel, BAR_COLORS);
    const stepValue = calculateStep(values, NO_OF_SECTIONS);
    const { labels, sectionsNeeded } = generateYAxisLabels(values, NO_OF_SECTIONS);

    return { totalBarValue, barChartData, stepValue, labels, sectionsNeeded };
  }, [timeSeriesData, rangeLabel]);

  // Custom tooltip component for bars
  const BarTooltip = ({
    type,
    value,
    frontColor,
  }: {
    type: string;
    value: number;
    frontColor: string;
  }) => (
    <View className="flex flex-row items-center justify-center gap-2 rounded-lg bg-background p-2 shadow-lg">
      <View className="mr-1 h-3 w-3 rounded-full" style={{ backgroundColor: frontColor }} />
      <Text className="font-medium">{type}</Text>
      <Text className="font-medium">{formatAmount(value)}</Text>
    </View>
  );

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>{`${rangeLabel} Tracking`}</CardTitle>
      </CardHeader>
      {chartData.totalBarValue > 0 ? (
        <CardFooter className="px-2">
          <BarChart
            data={chartData.barChartData}
            barWidth={BAR_WIDTH}
            spacing={BAR_SPACING}
            negativeStepValue={0}
            negativeStepHeight={0}
            roundedTop
            roundedBottom
            initialSpacing={70}
            endSpacing={70}
            stepValue={chartData.stepValue}
            showYAxisIndices
            yAxisLabelTexts={chartData.labels}
            autoCenterTooltip
            renderTooltip={BarTooltip}
            yAxisLabelWidth={40}
            yAxisTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            noOfSections={chartData.sectionsNeeded}
            isAnimated
            animationDuration={ANIMATION_DURATION}
            hideRules
          />
        </CardFooter>
      ) : (
        <BarChartSkeleton />
      )}
    </Card>
  );
}
