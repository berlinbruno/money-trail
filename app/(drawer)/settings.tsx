import {
  AboutCard,
  AppearanceCard,
  CurrencyCard,
  DataManagementCard,
  NotificationCard,
  SyncSettingsCard,
} from '@/components/settings';
import { type Option } from '@/components/ui/select';
import { APP_VERSION, CURRENCY_OPTIONS } from '@/constants/settingsConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { resetAllData } from '@/lib/database/settingsQueries';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, ToastAndroid } from 'react-native';

// Platform-specific message helper
const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Settings', message);
  }
};

export default function SettingsScreen() {
  const db = useSQLiteContext();

  // Theme context
  const { theme: selectedTheme, setTheme } = useTheme();

  // Settings context (non-theme settings)
  const {
    backgroundSyncEnabled,
    syncInterval,
    messageScanCount,
    lastSyncTime,
    selectedCurrency,
    pushNotificationsEnabled: notificationsEnabled,
    isLoading,

    // Actions from settings context
    setBackgroundSyncEnabled,
    setSyncIntervalMinutes,
    setMessageScanCount,
    resetLastSyncTime,
    setCurrency,
    setPushNotifications,
    refreshSettings,
  } = useSettings();

  const appVersion = useMemo(() => APP_VERSION, []);

  // Handler functions using context actions
  const handleThemeChange = useCallback(
    async (theme: string) => {
      try {
        await setTheme(theme as any);
        showMessage(`Theme set to ${theme}`);
      } catch (error) {
        console.error('Error saving theme:', error);
        showMessage('Failed to save theme setting');
      }
    },
    [setTheme]
  );

  const handleBackgroundSyncToggle = useCallback(
    async (value: boolean) => {
      try {
        await setBackgroundSyncEnabled(value);
        showMessage(`Background sync ${value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving background sync setting:', error);
        showMessage('Failed to save background sync setting');
      }
    },
    [setBackgroundSyncEnabled]
  );

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      try {
        await setPushNotifications(value);
        showMessage(`Notifications ${value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving notification setting:', error);
        showMessage('Failed to save notification setting');
      }
    },
    [setPushNotifications]
  );

  const handleSyncIntervalChange = useCallback(
    async (interval: number) => {
      try {
        await setSyncIntervalMinutes(interval as any);
        showMessage(`Sync interval set to ${interval} minutes`);
      } catch (error) {
        console.error('Error saving sync interval:', error);
        showMessage('Failed to save sync interval setting');
      }
    },
    [setSyncIntervalMinutes]
  );

  const handleMessageScanCountChange = useCallback(
    async (count: number) => {
      try {
        await setMessageScanCount(count as any);
        showMessage(`Message scan count set to ${count} messages`);
      } catch (error) {
        console.error('Error saving message scan count:', error);
        showMessage('Failed to save message scan count setting');
      }
    },
    [setMessageScanCount]
  );

  const handleResetSyncTime = useCallback(() => {
    resetLastSyncTime();
    showMessage('Last sync time reset');
  }, [resetLastSyncTime]);

  const handleCurrencyChange = useCallback(
    async (option: Option) => {
      if (option) {
        try {
          const currency = CURRENCY_OPTIONS.find((c: any) => c.code === option.value);
          if (currency) {
            await setCurrency(currency);
            showMessage(`Currency format set to ${option.value}`);
          }
        } catch (error) {
          console.error('Error saving currency setting:', error);
          showMessage('Failed to save currency setting');
        }
      }
    },
    [setCurrency]
  );

  const handleResetData = useCallback(async () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all transactions, alerts, and notifications. Your settings will be preserved. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData(db);
              showMessage('All data has been reset successfully');
            } catch (error) {
              console.error('Error resetting data:', error);
              showMessage('Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  }, [db]);

  const handleExportData = useCallback(() => {
    showMessage('Export data functionality not implemented');
  }, []);

  const handleImportData = useCallback(() => {
    showMessage('Import data functionality not implemented');
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshSettings();
      showMessage('Settings refreshed');
    } catch (error) {
      console.error('Error refreshing settings:', error);
      showMessage('Failed to refresh settings');
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
