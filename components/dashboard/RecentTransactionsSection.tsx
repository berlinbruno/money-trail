import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { RecentTx } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import { Link } from 'expo-router';

interface RecentTransactionsSectionProps {
  recentTransactions: RecentTx[];
}

export function DashboardRecentTransactionsSection({
  recentTransactions,
}: RecentTransactionsSectionProps) {
  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.map((transaction) => (
          <Text key={transaction.id} className="mb-1">
            {transaction.type === 'debit' ? 'Paid' : 'Received'} {transaction.title} -{' '}
            {formatAmount(transaction.amount)} ({capitalizeFirstLetter(transaction.category)})
          </Text>
        ))}
      </CardContent>
      <CardFooter>
        <Link href={'/(drawer)/(tabs)/transactions'}>
          <Text className="text-blue-600 underline">View All</Text>
        </Link>
      </CardFooter>
    </Card>
  );
}
