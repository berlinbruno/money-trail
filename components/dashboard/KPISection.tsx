import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIData } from '@/types/Insight';
import { formatAmount } from '@/utils/formatters';
import { KPIItem } from './KPIItem';

interface KPISectionProps {
  kpiData: KPIData;
}

export function DashboardKPISection({ kpiData }: KPISectionProps) {
  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>This Month</CardTitle>
      </CardHeader>
      <CardContent className="flex-row justify-around">
        <KPIItem title="Income" value={formatAmount(kpiData.totalIncome)} color="green" />
        <KPIItem title="Expense" value={formatAmount(kpiData.totalExpense)} color="#FF3B30" />
        <KPIItem title="Savings" value={formatAmount(kpiData.totalSavings)} color="#007AFF" />
      </CardContent>
    </Card>
  );
}
