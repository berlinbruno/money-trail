import {
  AboutCard,
  AppBehaviorCard,
  AppearanceCard,
  CurrencyCard,
  DataManagementCard,
  NotificationCard,
  SyncSettingsCard,
} from '@/components/settings';
import { type Option } from '@/components/ui/select';
import { APP_VERSION, CURRENCY_OPTIONS } from '@/constants/settingsConstants';
import { useDialog } from '@/contexts/DialogProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastProvider';
import { resetAllData } from '@/lib/database/settingsQueries';
import { useTheme as useNavigationTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();

  // Theme context
  const navigationTheme = useNavigationTheme();
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
        showToast(`Theme set to ${theme}`);
      } catch (error) {
        console.error('Error saving theme:', error);
        showToast('Failed to save theme setting');
      }
    },
    [selectedTheme, setTheme, showToast]
  );

  const handleBackgroundSyncToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (backgroundSyncEnabled === value) {
        return; // No change needed
      }

      try {
        const success = await setBackgroundSyncEnabled(value);
        if (success) {
          showToast(`Background sync ${value ? 'enabled' : 'disabled'}`);
        }
        // If success is false, permission dialog was shown, no toast needed
      } catch (error) {
        console.error('Error saving background sync setting:', error);
        showToast('Failed to save background sync setting');
      }
    },
    [backgroundSyncEnabled, setBackgroundSyncEnabled, showToast]
  );

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (notificationsEnabled === value) {
        return; // No change needed
      }

      try {
        await setPushNotifications(value);
        showToast(`Notifications ${value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving notification setting:', error);
        showToast('Failed to save notification setting');
      }
    },
    [notificationsEnabled, setPushNotifications, showToast]
  );

  const handleSyncIntervalChange = useCallback(
    async (interval: number) => {
      // Prevent unnecessary changes
      if (syncInterval === interval) {
        return; // No change needed
      }

      try {
        await setSyncIntervalMinutes(interval as any);
        showToast(`Sync interval set to ${interval} minutes`);
      } catch (error) {
        console.error('Error saving sync interval:', error);
        showToast('Failed to save sync interval setting');
      }
    },
    [syncInterval, setSyncIntervalMinutes, showToast]
  );

  const handleMessageScanCountChange = useCallback(
    async (count: number) => {
      // Prevent unnecessary changes
      if (messageScanCount === count) {
        return; // No change needed
      }

      try {
        await setMessageScanCount(count as any);
        showToast(`Message scan count set to ${count} messages`);
      } catch (error) {
        console.error('Error saving message scan count:', error);
        showToast('Failed to save message scan count setting');
      }
    },
    [messageScanCount, setMessageScanCount, showToast]
  );

  const handleResetSyncTime = useCallback(() => {
    resetLastSyncTime();
    showToast('Last sync time reset');
  }, [resetLastSyncTime, showToast]);

  const handleFetchOnLaunchToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (fetchOnLaunch === value) {
        return; // No change needed
      }

      try {
        const success = await setFetchOnLaunchEnabled(value);
        if (success) {
          showToast(`Fetch on launch ${value ? 'enabled' : 'disabled'}`);
        }
        // If success is false, permission dialog was shown, no toast needed
      } catch (error) {
        console.error('Error saving fetch on launch setting:', error);
        showToast('Failed to save fetch on launch setting');
      }
    },
    [fetchOnLaunch, setFetchOnLaunchEnabled, showToast]
  );

  const handleAutoApprovalToggle = useCallback(
    async (value: boolean) => {
      // Prevent unnecessary changes
      if (autoApproval === value) {
        return; // No change needed
      }

      try {
        await setAutoApprovalEnabled(value);
        showToast(`Auto approval ${value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving auto approval setting:', error);
        showToast('Failed to save auto approval setting');
      }
    },
    [autoApproval, setAutoApprovalEnabled, showToast]
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
            showToast(`Currency format set to ${option.value}`);
          }
        } catch (error) {
          console.error('Error saving currency setting:', error);
          showToast('Failed to save currency setting');
        }
      }
    },
    [selectedCurrency, setCurrency, showToast]
  );

  const handleResetData = useCallback(() => {
    showConfirmationDialog({
      title: 'Reset All Data',
      description:
        'This will delete all transactions, alerts, and notifications. Your settings will be preserved. This action cannot be undone.',
      confirmText: 'Reset',
      confirmVariant: 'destructive',
      loadingText: 'Resetting...',
      onConfirm: async () => {
        try {
          await resetAllData(db);
          // Refresh settings to update lastSyncTime display
          await refreshSettings();
          showToast('All transactions, alerts, and notifications have been deleted');
        } catch (error) {
          console.error('Error resetting data:', error);
          showToast('Unable to reset data. Please try again.');
          throw error; // Let the dialog handle the error state
        }
      },
    });
  }, [db, showToast, showConfirmationDialog, refreshSettings]);

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
      showToast('Unable to refresh settings');
    }
  };

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          colors={[navigationTheme.colors.primary]}
          tintColor={navigationTheme.colors.primary}
        />
      }>
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
    </ScrollView>
  );
}
