import {
  AboutCard,
  AppBehaviorCard,
  AppearanceCard,
  CurrencyCard,
  DataManagementCard,
  NotificationCard,
  SyncSettingsCard,
} from '@/components/settings';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { type Option } from '@/components/ui/select';
import { APP_VERSION, CURRENCY_OPTIONS } from '@/constants/settingsConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastHelpers } from '@/contexts/ToastProvider';
import { resetAllData } from '@/lib/database/settingsQueries';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { showSuccess, showError } = useToastHelpers();
  const [showResetDataDialog, setShowResetDataDialog] = useState(false);

  // Theme context
  const { theme: selectedTheme, setTheme } = useTheme();

  // Settings context (non-theme settings)
  const {
    backgroundSyncEnabled,
    syncInterval,
    messageScanCount,
    lastSyncTime,
    fetchOnLaunch,
    autoApproval,
    selectedCurrency,
    pushNotificationsEnabled: notificationsEnabled,
    isLoading,

    // Actions from settings context
    setBackgroundSyncEnabled,
    setSyncIntervalMinutes,
    setMessageScanCount,
    resetLastSyncTime,
    setFetchOnLaunchEnabled,
    setAutoApprovalEnabled,
    setCurrency,
    setPushNotifications,
    refreshSettings,
  } = useSettings();

  const appVersion = useMemo(() => APP_VERSION, []);

  // Handler functions using context actions
  const handleThemeChange = useCallback(
    async (theme: string) => {
      // Prevent unnecessary changes
      if (selectedTheme === theme) {
        return; // No change needed, no toast shown
      }

      try {
        await setTheme(theme as any);
        showSuccess({ title: 'Theme Updated', description: `Theme set to ${theme}` });
      } catch (error) {
        console.error('Error saving theme:', error);
        showError({ title: 'Theme Error', description: 'Failed to save theme setting' });
      }
    },
    [selectedTheme, setTheme, showSuccess, showError]
  );

  const handleBackgroundSyncToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (backgroundSyncEnabled === value) {
        return; // No change needed
      }

      try {
        await setBackgroundSyncEnabled(value);
        showSuccess({
          title: 'Background Sync Updated',
          description: `Background sync ${value ? 'enabled' : 'disabled'}`,
        });
      } catch (error) {
        console.error('Error saving background sync setting:', error);
        showError({ title: 'Sync Error', description: 'Failed to save background sync setting' });
      }
    },
    [backgroundSyncEnabled, setBackgroundSyncEnabled, showSuccess, showError]
  );

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (notificationsEnabled === value) {
        return; // No change needed
      }

      try {
        await setPushNotifications(value);
        showSuccess({
          title: 'Notifications Updated',
          description: `Notifications ${value ? 'enabled' : 'disabled'}`,
        });
      } catch (error) {
        console.error('Error saving notification setting:', error);
        showError({
          title: 'Notification Error',
          description: 'Failed to save notification setting',
        });
      }
    },
    [notificationsEnabled, setPushNotifications, showSuccess, showError]
  );

  const handleSyncIntervalChange = useCallback(
    async (interval: number) => {
      // Prevent unnecessary changes
      if (syncInterval === interval) {
        return; // No change needed
      }

      try {
        await setSyncIntervalMinutes(interval as any);
        showSuccess({
          title: 'Sync Interval Updated',
          description: `Sync interval set to ${interval} minutes`,
        });
      } catch (error) {
        console.error('Error saving sync interval:', error);
        showError({ title: 'Sync Error', description: 'Failed to save sync interval setting' });
      }
    },
    [syncInterval, setSyncIntervalMinutes, showSuccess, showError]
  );

  const handleMessageScanCountChange = useCallback(
    async (count: number) => {
      // Prevent unnecessary changes
      if (messageScanCount === count) {
        return; // No change needed
      }

      try {
        await setMessageScanCount(count as any);
        showSuccess({
          title: 'Message Count Updated',
          description: `Message scan count set to ${count} messages`,
        });
      } catch (error) {
        console.error('Error saving message scan count:', error);
        showError({
          title: 'Message Count Error',
          description: 'Failed to save message scan count setting',
        });
      }
    },
    [messageScanCount, setMessageScanCount, showSuccess, showError]
  );

  const handleResetSyncTime = useCallback(() => {
    resetLastSyncTime();
    showSuccess({ title: 'Sync Reset', description: 'Last sync time reset' });
  }, [resetLastSyncTime, showSuccess]);

  const handleFetchOnLaunchToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (fetchOnLaunch === value) {
        return; // No change needed
      }

      try {
        await setFetchOnLaunchEnabled(value);
        showSuccess({
          title: 'Fetch on Launch Updated',
          description: `Fetch on launch ${value ? 'enabled' : 'disabled'}`,
        });
      } catch (error) {
        console.error('Error saving fetch on launch setting:', error);
        showError({ title: 'Fetch Error', description: 'Failed to save fetch on launch setting' });
      }
    },
    [fetchOnLaunch, setFetchOnLaunchEnabled, showSuccess, showError]
  );

  const handleAutoApprovalToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (autoApproval === value) {
        return; // No change needed
      }

      try {
        await setAutoApprovalEnabled(value);
        showSuccess({
          title: 'Auto Approval Updated',
          description: `Auto approval ${value ? 'enabled' : 'disabled'}`,
        });
      } catch (error) {
        console.error('Error saving auto approval setting:', error);
        showError({
          title: 'Auto Approval Error',
          description: 'Failed to save auto approval setting',
        });
      }
    },
    [autoApproval, setAutoApprovalEnabled, showSuccess, showError]
  );

  const handleCurrencyChange = useCallback(
    async (option: Option) => {
      if (option) {
        try {
          const currency = CURRENCY_OPTIONS.find((c: any) => c.code === option.value);
          if (currency) {
            // Prevent unnecessary changes
            if (selectedCurrency?.code === currency.code) {
              return; // No change needed
            }

            await setCurrency(currency);
            showSuccess({
              title: 'Currency Updated',
              description: `Currency format set to ${option.value}`,
            });
          }
        } catch (error) {
          console.error('Error saving currency setting:', error);
          showError({ title: 'Currency Error', description: 'Failed to save currency setting' });
        }
      }
    },
    [selectedCurrency, setCurrency, showSuccess, showError]
  );

  const handleResetData = useCallback(() => {
    setShowResetDataDialog(true);
  }, []);

  const confirmResetData = useCallback(async () => {
    try {
      await resetAllData(db);
      showSuccess({
        title: 'Data Reset Complete',
        description: 'All transactions, alerts, and notifications have been deleted',
      });
      setShowResetDataDialog(false);
    } catch (error) {
      console.error('Error resetting data:', error);
      showError({
        title: 'Reset Failed',
        description: 'Unable to reset data. Please try again.',
      });
    }
  }, [db, showSuccess, showError]);

  const handleExportData = useCallback(() => {
    // These features should be disabled in UI instead of showing error toast
    console.log('Export data feature not yet implemented');
  }, []);

  const handleImportData = useCallback(() => {
    // These features should be disabled in UI instead of showing error toast
    console.log('Import data feature not yet implemented');
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshSettings();
      // Silent refresh - no toast needed for pull-to-refresh
    } catch (error) {
      console.error('Error refreshing settings:', error);
      showError({
        title: 'Refresh Failed',
        description: 'Unable to refresh settings',
      });
    }
  };

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}>
      <AppearanceCard selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />

      <SyncSettingsCard
        backgroundSyncEnabled={backgroundSyncEnabled}
        syncInterval={syncInterval}
        messageScanCount={messageScanCount}
        lastSyncTime={lastSyncTime}
        onBackgroundSyncToggle={handleBackgroundSyncToggle}
        onSyncIntervalChange={handleSyncIntervalChange}
        onMessageScanCountChange={handleMessageScanCountChange}
        onResetSyncTime={handleResetSyncTime}
      />

      <AppBehaviorCard
        fetchOnLaunch={fetchOnLaunch}
        autoApproval={autoApproval}
        onFetchOnLaunchToggle={handleFetchOnLaunchToggle}
        onAutoApprovalToggle={handleAutoApprovalToggle}
      />

      <CurrencyCard selectedCurrency={selectedCurrency} onCurrencyChange={handleCurrencyChange} />

      <NotificationCard
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={handleNotificationsToggle}
      />

      <DataManagementCard
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      <AboutCard appVersion={appVersion} />

      {/* Reset Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetDataDialog}
        onOpenChange={setShowResetDataDialog}
        title="Reset All Data"
        description="This will delete all transactions, alerts, and notifications. Your settings will be preserved. This action cannot be undone."
        confirmText="Reset"
        confirmVariant="destructive"
        loadingText="Resetting..."
        onConfirm={confirmResetData}
      />
    </ScrollView>
  );
}
