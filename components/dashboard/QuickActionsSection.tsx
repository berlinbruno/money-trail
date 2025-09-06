import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { insertTransactions } from '@/lib/smsSync';
import { useTheme } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CheckCheck, MessageCircleMore, PlusCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export function DashboardQuickActionsSection() {
  const theme = useTheme();
  const db = useSQLiteContext();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row justify-around gap-2">
        <Link asChild href={'/(drawer)/(tabs)/transactions'}>
          <TouchableOpacity className="flex h-24 w-24 flex-col items-center justify-center space-x-1 rounded-lg bg-secondary">
            <PlusCircle color={theme.colors.text} />
            <Text>Add Txn</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          className="flex h-24 w-24 flex-col items-center justify-center space-x-1 rounded-lg bg-secondary"
          onPress={async () => await insertTransactions(db)}>
          <MessageCircleMore color={theme.colors.text} />
          <Text>Scan SMS</Text>
        </TouchableOpacity>
        <Link asChild href={'/(drawer)/approveTransaction'}>
          <TouchableOpacity className="flex h-24 w-24 flex-col items-center justify-center space-x-1 rounded-lg bg-secondary">
            <CheckCheck color={theme.colors.text} />
            <Text>Approve</Text>
          </TouchableOpacity>
        </Link>
        <Link asChild href={'/debugScreen'}>
          <TouchableOpacity className="flex h-24 w-24 flex-col items-center justify-center space-x-1 rounded-lg bg-secondary">
            <CheckCheck color={theme.colors.text} />
            <Text>Debug</Text>
          </TouchableOpacity>
        </Link>
      </CardContent>
    </Card>
  );
}
