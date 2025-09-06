import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryBreakdown } from '@/types/Insight';
import { getPieChartData } from '@/utils/insightsUtils';
import { useTheme } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { ANIMATION_DURATION, PIE_RADIUS } from '../../constants/insightsConstants';
import LegendList from './LegendList';
import PieCenterLabel from './PieCenterLabel';

type PieChartSectionProps = {
  categoryBreakdown: {
    income: CategoryBreakdown[];
    expense: CategoryBreakdown[];
  };
};

export default function PieChartSection({ categoryBreakdown }: PieChartSectionProps) {
  const [incomeFocused, setIncomeFocused] = useState<CategoryBreakdown | null>(null);
  const [expenseFocused, setExpenseFocused] = useState<CategoryBreakdown | null>(null);
  const theme = useTheme();
  const incomePieChartData = useMemo(
    () => getPieChartData(categoryBreakdown.income, incomeFocused),
    [categoryBreakdown.income, incomeFocused]
  );
  const expensePieChartData = useMemo(
    () => getPieChartData(categoryBreakdown.expense, expenseFocused),
    [categoryBreakdown.expense, expenseFocused]
  );

  const hasIncome = incomePieChartData.length > 0;
  const hasExpense = expensePieChartData.length > 0;

  const incomeTotal = useMemo(
    () => incomePieChartData.reduce((sum: number, c: any) => sum + c.value, 0),
    [incomePieChartData]
  );
  const expenseTotal = useMemo(
    () => expensePieChartData.reduce((sum: number, c: any) => sum + c.value, 0),
    [expensePieChartData]
  );

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Breakdown by Category</CardTitle>
      </CardHeader>
      <CardFooter
        className={
          hasIncome && hasExpense
            ? 'flex w-full flex-row items-start justify-between gap-8'
            : 'flex flex-col items-center justify-center'
        }>
        {hasIncome && (
          <CardContent
            className={
              hasIncome && hasExpense
                ? 'flex flex-col items-center px-2'
                : 'col-span-2 flex flex-col items-center'
            }>
            <PieChart
              data={incomePieChartData}
              donut
              focusOnPress
              showGradient
              innerRadius={PIE_RADIUS - 15}
              innerCircleColor={theme.colors.background}
              radius={PIE_RADIUS}
              isAnimated
              animationDuration={ANIMATION_DURATION}
              onPress={(item: CategoryBreakdown) => setIncomeFocused(item)}
              centerLabelComponent={() => (
                <PieCenterLabel focused={incomeFocused} fallbackLabel="Income" />
              )}
            />
            <View className="mt-2 flex flex-row flex-wrap justify-center">
              <LegendList data={incomePieChartData} total={incomeTotal} prefix="income" />
            </View>
          </CardContent>
        )}
        {hasExpense && (
          <CardContent
            className={
              hasIncome && hasExpense
                ? 'flex flex-col items-center px-2'
                : 'col-span-2 flex flex-col items-center'
            }>
            <PieChart
              data={expensePieChartData}
              donut
              showGradient
              focusOnPress
              innerRadius={PIE_RADIUS - 15}
              innerCircleColor={theme.colors.background}
              radius={PIE_RADIUS}
              isAnimated
              animationDuration={ANIMATION_DURATION}
              onPress={(item: CategoryBreakdown) => setExpenseFocused(item)}
              centerLabelComponent={() => (
                <PieCenterLabel focused={expenseFocused} fallbackLabel="Expense" />
              )}
            />
            <View className="mt-2 flex flex-row flex-wrap justify-center">
              <LegendList data={expensePieChartData} total={expenseTotal} prefix="expense" />
            </View>
          </CardContent>
        )}
      </CardFooter>
      {!hasIncome && !hasExpense && (
        <CardFooter className="grid grid-cols-2 items-center justify-between gap-2">
          <View
            style={{ width: PIE_RADIUS * 2, height: PIE_RADIUS * 2 }}
            className="my-2 flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-full w-full rounded-full" />
            <Skeleton className="h-4 w-44 rounded-full" />
            <Skeleton className="h-4 w-44 rounded-full" />
          </View>
          <View
            style={{ width: PIE_RADIUS * 2, height: PIE_RADIUS * 2 }}
            className="my-2 flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-full w-full rounded-full" />
            <Skeleton className="h-4 w-44 rounded-full" />
            <Skeleton className="h-4 w-44 rounded-full" />
          </View>
        </CardFooter>
      )}
    </Card>
  );
}
