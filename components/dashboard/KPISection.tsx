import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TREND_COLORS } from '@/constants/insightsConstants';
import { KPIData } from '@/types/Insight';
import { formatAmount } from '@/utils/formatters';
import { KPIItem } from './KPIItem';

export function DashboardKPISection({ kpiData }: { kpiData: KPIData }) {
  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>This Month</CardTitle>
      </CardHeader>
      <CardContent className="flex-row justify-around">
        <KPIItem
          title="Income"
          value={formatAmount(kpiData.totalIncome)}
          color={TREND_COLORS.income}
        />
        <KPIItem
          title="Expense"
          value={formatAmount(kpiData.totalExpense)}
          color={TREND_COLORS.expense}
        />
        <KPIItem
          title="Savings"
          value={formatAmount(kpiData.totalSavings)}
          color={TREND_COLORS.saving}
        />
      </CardContent>
    </Card>
  );
}
