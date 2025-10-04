import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useDialog } from '@/contexts/DialogProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastProvider';
import { syncTransactions } from '@/lib/sms/sync';
import { useTheme } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  CheckCheck,
  Code,
  MessageCircleMore,
  MessageSquareCode,
  PlusCircle,
} from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

export function DashboardQuickActionsSection() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { messageScanCount } = useSettings();
  const { checkSMSPermissionWithDialog } = useDialog();
  const { showToast } = useToast();

  const handleScanSMS = async () => {
    try {
      // Check SMS permission first
      const hasPermission = await checkSMSPermissionWithDialog();
      if (!hasPermission) {
        return; // Permission dialog will be shown by the hook
      }

      const result = await syncTransactions(db, {
        maxMessages: messageScanCount,
        defaultAccount: 'default',
      });

      if (result.success) {
        showToast({
          message: `SMS scan completed. Processed ${result.processed} messages, added ${result.inserted} transactions.`,
          duration: 'long',
        });
      } else {
        showToast({
          message: `SMS scan failed: ${result.errorMessages.join(', ')}`,
          duration: 'long',
        });
      }

      console.log('Manual SMS scan completed:', result);
    } catch (error) {
      console.error('Failed to scan SMS:', error);
      showToast({
        message: 'Failed to scan SMS messages. Please try again.',
        duration: 'long',
      });
    }
  };

  return (
    <Card className="mb-2">
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
            onPress={handleScanSMS}>
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
          <Link asChild href={'/debug'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <Code color={theme.colors.text} />
              <Text>Debug</Text>
            </TouchableOpacity>
          </Link>
          <Link asChild href={'/background'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <MessageSquareCode color={theme.colors.text} />
              <Text>Background</Text>
            </TouchableOpacity>
          </Link>
          <Link asChild href={'/logs'}>
            <TouchableOpacity className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <MessageCircleMore color={theme.colors.text} />
              <Text>Logs</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </CardContent>
    </Card>
  );
}
