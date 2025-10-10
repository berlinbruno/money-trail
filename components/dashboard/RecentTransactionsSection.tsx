import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useSettings } from '@/contexts/SettingsContext';
import { RecentTx } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmountWithCurrency } from '@/utils/formatterUtils';
import { Link } from 'expo-router';

interface RecentTransactionsSectionProps {
  recentTransactions: RecentTx[];
}

export function RecentTransactionsSection({ recentTransactions }: RecentTransactionsSectionProps) {
  const { selectedCurrency } = useSettings();

  // Don't render the card if there are no recent transactions
  if (!recentTransactions || recentTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Recent Transactions (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.map((transaction) => (
          <Text key={transaction.id} className="mb-1">
            {transaction.type === 'debit' ? 'Paid' : 'Received'} {transaction.title} -{' '}
            {formatAmountWithCurrency(transaction.amount, selectedCurrency)} (
            {capitalizeFirstLetter(transaction.category)})
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
