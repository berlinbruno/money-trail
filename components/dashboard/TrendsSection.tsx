import { TrendCardItem } from '@/components/dashboard/TrendCardItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendRow } from '@/types/Insight';

interface TrendsSectionProps {
  monthlyTrends: TrendRow[];
}

export function TrendsSection({ monthlyTrends }: TrendsSectionProps) {
  // Don't render the card if there are no trends
  if (!monthlyTrends || monthlyTrends.length === 0) {
    return null;
  }

  return (
    <Card className="mb-2">
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
