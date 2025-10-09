import TransactionForm from '@/components/transaction/TransactionForm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseModal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/contexts/DialogProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastProvider';
import { useTransaction } from '@/hooks/useTransaction';
import { syncTransactions } from '@/lib/sms/sync';
import { EditTransaction, NewTransaction } from '@/types/Transaction';
import { refreshSettingsGlobally } from '@/utils/settingsUtils';
import { useTheme } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  CheckCheck,
  Code,
  Loader2,
  MessageCircleMore,
  MessageSquareCode,
  PlusCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

interface QuickActionsSectionProps {
  pendingCount: number;
}

export function QuickActionsSection({ pendingCount }: QuickActionsSectionProps) {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { messageScanCount } = useSettings();
  const { checkSMSPermissionWithDialog } = useDialog();
  const { showToast } = useToast();
  const { actions: appActions } = useApp();
  const { createTransaction } = useTransaction();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanSMS = async () => {
    if (isScanning) return; // Prevent multiple scans

    try {
      setIsScanning(true);

      // Check SMS permission first
      const hasPermission = await checkSMSPermissionWithDialog();
      if (!hasPermission) {
        setIsScanning(false);
        return; // Permission dialog will be shown by the hook
      }

      const result = await syncTransactions(db, {
        maxMessages: messageScanCount,
        defaultAccount: 'default',
        onSyncComplete: () => {
          // Refresh settings when manual sync completes
          refreshSettingsGlobally().catch(console.error);
        },
      });

      if (result.success) {
        showToast({
          message: `SMS scan completed. Processed ${result.processed} messages, added ${result.inserted} transactions.`,
          duration: 'long',
        });
        // Trigger transaction refresh to update all screens
        appActions.triggerTransactionDataUpdate();
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
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <View className="flex flex-row justify-between">
          <TouchableOpacity
            className="mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary"
            onPress={() => setShowTransactionModal(true)}>
            <PlusCircle color={theme.colors.text} />
            <Text>Add Txn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mx-1 flex h-24 flex-1 items-center justify-center rounded-lg ${
              isScanning ? 'bg-muted' : 'bg-secondary'
            }`}
            onPress={handleScanSMS}
            disabled={isScanning}>
            {isScanning ? (
              <View className="animate-spin">
                <Loader2 color={theme.colors.text} />
              </View>
            ) : (
              <MessageCircleMore color={theme.colors.text} />
            )}
            <Text className={isScanning ? 'text-muted-foreground' : ''}>
              {isScanning ? 'Scanning...' : 'Scan SMS'}
            </Text>
          </TouchableOpacity>
          <Link asChild href={'/(drawer)/approveTransaction'}>
            <TouchableOpacity className="relative mx-1 flex h-24 flex-1 items-center justify-center rounded-lg bg-secondary">
              <CheckCheck color={theme.colors.text} />
              <Text>Approve</Text>
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1">
                  <Text>{pendingCount > 999 ? '999+' : pendingCount}</Text>
                </Badge>
              )}
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

      {/* Transaction Modal */}
      <BaseModal
        title="Add Transaction"
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}>
        <TransactionForm
          onSubmit={async (transaction: NewTransaction | EditTransaction) => {
            try {
              await createTransaction(transaction as NewTransaction);
              // Hook already shows success toast and triggers updates
              setShowTransactionModal(false);
            } catch (err) {
              console.error('Failed to save transaction:', err);
              showToast('Unable to save transaction');
            }
          }}
          onCancel={() => setShowTransactionModal(false)}
        />
      </BaseModal>
    </Card>
  );
}
