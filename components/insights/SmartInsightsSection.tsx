import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InsightsSummary } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import { useMemo } from 'react';
import { TREND_COLORS } from '../../constants/insightsConstants';
import InsightItem from './InsightItem';
import InsightSkeleton from './InsightSkeleton';

type InsightItemConfig = {
  color: string;
  text: string;
  condition: boolean;
};

/**
 * SmartInsightsSection component displays key financial insights
 * such as highest spend, average spend, total income, and expenses
 */
export default function SmartInsightsSection({
  insightsSummary,
}: {
  insightsSummary: InsightsSummary | null;
}) {
  // Check if we have any meaningful data to display
  const hasData = useMemo(() => {
    if (!insightsSummary) return false;

    return (
      insightsSummary.highestExpenseAmount > 0 ||
      insightsSummary.averageExpense > 0 ||
      insightsSummary.totalIncome > 0 ||
      insightsSummary.totalExpense > 0
    );
  }, [insightsSummary]);

  // Prepare insight items configuration
  const insightItems = useMemo(() => {
    if (!insightsSummary) return [];

    const items: InsightItemConfig[] = [
      {
        color: TREND_COLORS.prevSaving,
        text: `Highest spend: ${formatAmount(insightsSummary.highestExpenseAmount)} on ${capitalizeFirstLetter(insightsSummary.highestExpenseCategory)}`,
        condition: insightsSummary.highestExpenseAmount > 0,
      },
      {
        color: TREND_COLORS.income,
        text: `Average spend: ${formatAmount(insightsSummary.averageExpense)}`,
        condition: insightsSummary.averageExpense > 0,
      },
      {
        color: TREND_COLORS.income,
        text: `Total income: ${formatAmount(insightsSummary.totalIncome)}`,
        condition: insightsSummary.totalIncome > 0,
      },
      {
        color: TREND_COLORS.expense,
        text: `Total expense: ${formatAmount(insightsSummary.totalExpense)}`,
        condition: insightsSummary.totalExpense > 0,
      },
    ];

    return items.filter((item) => item.condition);
  }, [insightsSummary]);

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Smart Insights</CardTitle>
      </CardHeader>
      {hasData ? (
        <CardFooter className="flex-col items-start">
          {insightItems.map((item, index) => (
            <InsightItem key={`insight-${index}`} color={item.color} text={item.text} />
          ))}
        </CardFooter>
      ) : (
        <InsightSkeleton />
      )}
    </Card>
  );
}
