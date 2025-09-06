import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ANIMATION_DURATION, PIE_RADIUS, SEGMENTS } from '@/constants/insightsConstants';
import { CategoryBreakdown } from '@/types/Insight';
import { getPieChartData } from '@/utils/insightsUtils';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { PieChart } from 'react-native-gifted-charts';
import { PieChartSkeleton } from './InsightSkeleton';
import LegendList from './LegendList';
import PieCenterLabel from './PieCenterLabel';

type PieChartSectionProps = {
  categoryBreakdown: {
    income: CategoryBreakdown[];
    expense: CategoryBreakdown[];
  };
};

/**
 * PieChart section component for visualizing income and expense distribution
 */
export default function PieChartSection({ categoryBreakdown }: PieChartSectionProps) {
  const theme = useTheme();

  // Segment control state
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const selectedSegment = useMemo(
    () => SEGMENTS[selectedSegmentIndex].toLowerCase() as 'income' | 'expense',
    [selectedSegmentIndex]
  );

  // Track focused items
  const [incomeFocused, setIncomeFocused] = useState<CategoryBreakdown | null>(null);
  const [expenseFocused, setExpenseFocused] = useState<CategoryBreakdown | null>(null);

  // Prepare chart data
  const incomePieChartData = useMemo(
    () => getPieChartData(categoryBreakdown.income, incomeFocused),
    [categoryBreakdown.income, incomeFocused]
  );
  const expensePieChartData = useMemo(
    () => getPieChartData(categoryBreakdown.expense, expenseFocused),
    [categoryBreakdown.expense, expenseFocused]
  );

  // Determine which data to use based on selected segment
  const currentData = useMemo(
    () => (selectedSegment === 'income' ? incomePieChartData : expensePieChartData),
    [selectedSegment, incomePieChartData, expensePieChartData]
  );

  // Calculate if we have data to display
  const hasData = currentData.length > 0;

  // Calculate totals for percentage calculations
  const incomeTotal = useMemo(
    () => incomePieChartData.reduce((sum: number, c: any) => sum + c.value, 0),
    [incomePieChartData]
  );
  const expenseTotal = useMemo(
    () => expensePieChartData.reduce((sum: number, c: any) => sum + c.value, 0),
    [expensePieChartData]
  );

  // Determine which total to use based on selected segment
  const currentTotal = useMemo(
    () => (selectedSegment === 'income' ? incomeTotal : expenseTotal),
    [selectedSegment, incomeTotal, expenseTotal]
  );

  // Handle segment change
  const handleSegmentChange = useCallback(
    (e: { nativeEvent: { selectedSegmentIndex: number } }) => {
      setSelectedSegmentIndex(e.nativeEvent.selectedSegmentIndex);
      // Reset any focused items when switching segments
      if (e.nativeEvent.selectedSegmentIndex === 0) {
        setExpenseFocused(null);
      } else {
        setIncomeFocused(null);
      }
    },
    []
  );

  // Handle pie chart focus
  const handlePiePress = useCallback(
    (item: CategoryBreakdown) => {
      if (selectedSegment === 'income') {
        setIncomeFocused(item);
      } else {
        setExpenseFocused(item);
      }
    },
    [selectedSegment]
  );

  // Get the current focused item
  const currentFocused = useMemo(
    () => (selectedSegment === 'income' ? incomeFocused : expenseFocused),
    [selectedSegment, incomeFocused, expenseFocused]
  );

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Distribution Analysis</CardTitle>
        <SegmentedControl
          values={['Income', 'Expense']}
          selectedIndex={selectedSegmentIndex}
          onChange={handleSegmentChange}
          style={{ margin: 8, borderRadius: 8 }}
          tintColor={theme.colors.primary}
          backgroundColor={theme.colors.background}
          fontStyle={{ color: theme.colors.text }}
          activeFontStyle={{
            color: theme.dark ? theme.colors.background : theme.colors.primary,
            fontWeight: '600',
          }}
        />
      </CardHeader>

      {hasData ? (
        <CardContent className="items-center justify-center">
          <PieChart
            data={currentData}
            donut
            focusOnPress
            showGradient
            innerRadius={PIE_RADIUS - 35}
            innerCircleColor={theme.colors.background}
            radius={PIE_RADIUS}
            isAnimated
            animationDuration={ANIMATION_DURATION}
            onPress={handlePiePress}
            centerLabelComponent={() => (
              <PieCenterLabel
                focused={currentFocused}
                fallbackLabel={selectedSegment === 'income' ? 'Income' : 'Expense'}
              />
            )}
          />
          <LegendList data={currentData} total={currentTotal} prefix={selectedSegment} />
        </CardContent>
      ) : (
        <PieChartSkeleton />
      )}
    </Card>
  );
}
