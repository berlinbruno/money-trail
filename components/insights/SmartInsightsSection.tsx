import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightsSummary } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import { TREND_COLORS } from '../../constants/insightsConstants';
import InsightItem from './InsightItem';

export default function SmartInsightsSection({
  insightsSummary,
}: {
  insightsSummary: InsightsSummary | null;
}) {
  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Smart Insights</CardTitle>
      </CardHeader>
      {insightsSummary &&
      (insightsSummary.highestExpenseAmount > 0 ||
        insightsSummary.averageExpense > 0 ||
        insightsSummary.totalIncome > 0 ||
        insightsSummary.totalExpense > 0) ? (
        <CardFooter className="flex-col items-start">
          {insightsSummary.highestExpenseAmount > 0 && (
            <InsightItem
              color={TREND_COLORS.prevSaving}
              text={`Highest spend: ${formatAmount(
                insightsSummary.highestExpenseAmount
              )} on ${capitalizeFirstLetter(insightsSummary.highestExpenseCategory)}`}
            />
          )}
          {insightsSummary.averageExpense > 0 && (
            <InsightItem
              color={TREND_COLORS.income}
              text={`Average spend: ${formatAmount(insightsSummary.averageExpense)}`}
            />
          )}
          {insightsSummary.totalIncome > 0 && (
            <InsightItem
              color={TREND_COLORS.income}
              text={`Total income: ${formatAmount(insightsSummary.totalIncome)}`}
            />
          )}
          {insightsSummary.totalExpense > 0 && (
            <InsightItem
              color={TREND_COLORS.expense}
              text={`Total expense: ${formatAmount(insightsSummary.totalExpense)}`}
            />
          )}
        </CardFooter>
      ) : (
        <CardFooter className="flex-col items-start gap-2">
          <Skeleton className="h-4 w-56 rounded-full" />
          <Skeleton className="h-4 w-44 rounded-full" />
          <Skeleton className="h-4 w-56 rounded-full" />
          <Skeleton className="h-4 w-44 rounded-full" />
        </CardFooter>
      )}
    </Card>
  );
}
