import { TrendCardItem } from '@/components/dashboard/TrendCardItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendRow } from '@/types/Insight';

interface TrendsSectionProps {
  monthlyTrends: TrendRow[];
}

export function DashboardTrendsSection({ monthlyTrends }: TrendsSectionProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Trends</CardTitle>
      </CardHeader>
      <CardContent className="gap-1">
        {monthlyTrends.map((trend) => (
          <TrendCardItem key={trend.id} {...trend} />
        ))}
      </CardContent>
    </Card>
  );
}
