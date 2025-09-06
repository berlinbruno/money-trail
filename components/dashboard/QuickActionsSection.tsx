import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { insertTransactions } from '@/lib/smsSync';
import { useTheme } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CheckCheck, Code, MessageCircleMore, PlusCircle } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

export function DashboardQuickActionsSection() {
  const theme = useTheme();
  const db = useSQLiteContext();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <View className="flex flex-row justify-between">
          <Link asChild href={'/(drawer)/(tabs)/transactions'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <PlusCircle color={theme.colors.text} />
              <Text>Add Txn</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary"
            onPress={async () => await insertTransactions(db)}>
            <MessageCircleMore color={theme.colors.text} />
            <Text>Scan SMS</Text>
          </TouchableOpacity>
          <Link asChild href={'/(drawer)/approveTransaction'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <CheckCheck color={theme.colors.text} />
              <Text>Approve</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex flex-row justify-between">
          <Link asChild href={'/debugScreen'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <Code color={theme.colors.text} />
              <Text>Debug</Text>
            </TouchableOpacity>
          </Link>
          <View className="mx-1 flex-1" />
          <View className="mx-1 flex-1" />
        </View>
      </CardContent>
    </Card>
  );
}
