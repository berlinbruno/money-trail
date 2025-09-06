import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { insightsDataset } from '@/types/Insight';
import { formatAmount } from '@/utils/formatters';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  ANIMATION_DURATION,
  BAR_COLORS,
  BAR_SPACING,
  BAR_WIDTH,
  NO_OF_SECTIONS,
} from '../../constants/insightsConstants';
import {
  calculateStep,
  calculateTotals,
  generateYAxisLabels,
  getBarChartData,
} from '../../utils/insightsUtils';
import { Text } from '../ui/text';

interface BarChartSectionProps {
  timeSeriesData: insightsDataset | null;
  rangeLabel: keyof insightsDataset;
}

export default function BarChartSection({ timeSeriesData, rangeLabel }: BarChartSectionProps) {
  const theme = useTheme();

  // Calculate totals and chart data
  const { maxIncome, maxExpense, maxSavings } = calculateTotals(timeSeriesData, rangeLabel);
  const values = [maxIncome, maxExpense, maxSavings];
  const totalBarValue = values.reduce((sum, v) => sum + v, 0);
  const barChartData = getBarChartData(timeSeriesData, rangeLabel, BAR_COLORS);
  const stepValue = calculateStep(values, NO_OF_SECTIONS);
  const yAxisLabelTexts = generateYAxisLabels(values, NO_OF_SECTIONS);

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>{`${rangeLabel} Tracking`}</CardTitle>
      </CardHeader>
      {totalBarValue > 0 ? (
        <CardFooter>
          <BarChart
            data={barChartData}
            barWidth={BAR_WIDTH}
            spacing={BAR_SPACING}
            negativeStepValue={0}
            negativeStepHeight={0}
            roundedTop
            roundedBottom
            initialSpacing={70}
            endSpacing={70}
            stepValue={stepValue}
            showYAxisIndices
            yAxisLabelTexts={yAxisLabelTexts}
            autoCenterTooltip
            renderTooltip={(item: { type: string; value: number; frontColor: string }) => (
              <View className="flex flex-row items-center justify-center gap-2 rounded-lg bg-background p-2 shadow-lg">
                <View
                  className="mr-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.frontColor }}
                />
                <Text className="font-medium">{item.type}</Text>
                <Text className="font-medium">{formatAmount(item.value)}</Text>
              </View>
            )}
            yAxisLabelWidth={50}
            yAxisTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 12 }}
            noOfSections={NO_OF_SECTIONS}
            isAnimated
            animationDuration={ANIMATION_DURATION}
            hideRules
          />
        </CardFooter>
      ) : (
        <View className="p-6">
          <Skeleton className="h-56 rounded-lg" />
        </View>
      )}
    </Card>
  );
}
