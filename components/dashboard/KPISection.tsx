import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TREND_COLORS } from '@/constants/insightsConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { KPIData } from '@/types/Insight';
import { formatAmountWithCurrency } from '@/utils/formatterUtils';
import { KPIItem } from './KPIItem';

export function KPISection({ kpiData }: { kpiData: KPIData }) {
  const { selectedCurrency } = useSettings();

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>This Month</CardTitle>
      </CardHeader>
      <CardContent className="flex-row justify-around">
        <KPIItem
          title="Income"
          value={formatAmountWithCurrency(kpiData.totalIncome, selectedCurrency)}
          color={TREND_COLORS.income}
        />
        <KPIItem
          title="Expense"
          value={formatAmountWithCurrency(kpiData.totalExpense, selectedCurrency)}
          color={TREND_COLORS.expense}
        />
        <KPIItem
          title="Savings"
          value={formatAmountWithCurrency(kpiData.totalSavings, selectedCurrency)}
          color={TREND_COLORS.saving}
        />
      </CardContent>
    </Card>
  );
}
