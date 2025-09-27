import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import {
  APP_VERSION,
  CURRENCY_OPTIONS,
  CURRENCY_PREVIEW_AMOUNT,
  MESSAGE_SCAN_COUNTS,
  SYNC_INTERVALS,
} from '@/constants/settingsConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { THEME_OPTIONS, useTheme } from '@/contexts/ThemeContext';
import { resetAllData } from '@/lib/database/settingsQueries';
import { formatCurrencyLabel, formatSyncInterval } from '@/utils/formatters';
import { logSystemTheme } from '@/utils/themeUtils';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

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
          const currency = CURRENCY_OPTIONS.find((c) => c.code === option.value);
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

  const handleTestSystemTheme = useCallback(() => {
    const themeInfo = logSystemTheme();
    showMessage(
      `System theme: ${themeInfo.currentTheme} (${themeInfo.isDark ? 'Dark' : 'Light'} mode)`
    );
  }, []);

  // Memoized components for better performance
  const AppearanceCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="py-2">
            <Text className="mb-2 font-medium">Theme</Text>
            <Text className="mb-3 text-sm text-muted-foreground">
              Select light, dark, or system theme
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {THEME_OPTIONS.map((theme) => (
                <TouchableOpacity
                  key={theme}
                  className={`rounded-full px-3 py-2 ${
                    selectedTheme === theme ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onPress={() => handleThemeChange(theme)}>
                  <Text
                    className={
                      selectedTheme === theme
                        ? 'text-primary-foreground'
                        : 'text-secondary-foreground'
                    }>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CardContent>
      </Card>
    ),
    [selectedTheme, handleThemeChange]
  );
  const SyncSettingsCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Sync & Background Tasks</CardTitle>
          <CardDescription>Configure automatic SMS processing</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between border-b border-border py-3">
            <View className="flex-1">
              <Text className="font-medium">Background Sync</Text>
              <Text className="text-sm text-muted-foreground">
                Automatically process SMS messages
              </Text>
            </View>
            <Switch checked={backgroundSyncEnabled} onCheckedChange={handleBackgroundSyncToggle} />
          </View>

          <View className="py-3">
            <Text className="mb-2 font-medium">Sync Interval</Text>
            <Text className="mb-3 text-sm text-muted-foreground">
              How often to check for new SMS messages
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
              contentContainerStyle={{ gap: 8 }}>
              {SYNC_INTERVALS.map((interval) => (
                <TouchableOpacity
                  key={interval}
                  className={`rounded-full px-3 py-2 ${
                    syncInterval === interval ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onPress={() => handleSyncIntervalChange(interval)}>
                  <Text
                    className={
                      syncInterval === interval
                        ? 'text-primary-foreground'
                        : 'text-secondary-foreground'
                    }>
                    {formatSyncInterval(interval)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="border-t border-border py-3">
            <Text className="mb-2 font-medium">Messages to Scan</Text>
            <Text className="mb-3 text-sm text-muted-foreground">
              Maximum number of SMS messages to process per sync
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
              contentContainerStyle={{ gap: 8 }}>
              {MESSAGE_SCAN_COUNTS.map((count) => (
                <TouchableOpacity
                  key={count}
                  className={`rounded-full px-3 py-2 ${
                    messageScanCount === count ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onPress={() => handleMessageScanCountChange(count)}>
                  <Text
                    className={
                      messageScanCount === count
                        ? 'text-primary-foreground'
                        : 'text-secondary-foreground'
                    }>
                    {count} msgs
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="border-t border-border pt-3">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Last Sync</Text>
                <Text className="text-sm text-muted-foreground">
                  {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never synced'}
                </Text>
              </View>
              <Button variant="outline" size="sm" onPress={handleResetSyncTime}>
                <Text>Reset</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    ),
    [
      backgroundSyncEnabled,
      syncInterval,
      messageScanCount,
      lastSyncTime,
      handleBackgroundSyncToggle,
      handleSyncIntervalChange,
      handleMessageScanCountChange,
      handleResetSyncTime,
    ]
  );

  const CurrencyCard = useMemo(() => {
    // Convert currency to Option format for Select component
    const currencyOption = {
      value: selectedCurrency.code,
      label: formatCurrencyLabel(selectedCurrency),
    };

    return (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Currency Format</CardTitle>
          <CardDescription>Select your preferred currency display format</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="mb-3">
            <Text className="mb-2 font-medium">Currency</Text>
            <Text className="mb-3 text-sm text-muted-foreground">
              Choose how amounts are displayed in the app
            </Text>
            <Select value={currencyOption} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem
                    key={currency.code}
                    value={currency.code}
                    label={formatCurrencyLabel(currency)}>
                    <Text>{formatCurrencyLabel(currency)}</Text>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View className="border-t border-border pt-3">
            <Text className="mb-2 font-medium">Preview</Text>
            <View className="rounded-lg bg-muted p-3">
              <Text className="text-sm text-muted-foreground">Sample amount:</Text>
              <Text className="text-lg font-semibold">
                {selectedCurrency.symbol}
                {CURRENCY_PREVIEW_AMOUNT}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }, [selectedCurrency, handleCurrencyChange]);

  const NotificationCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="font-medium">Push Notifications</Text>
              <Text className="text-sm text-muted-foreground">
                Receive alerts for important transactions
              </Text>
            </View>
            <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
          </View>
        </CardContent>
      </Card>
    ),
    [notificationsEnabled, handleNotificationsToggle]
  );

  const DataManagementCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Import, export, or reset your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="mb-2 w-full" variant="outline" onPress={handleExportData}>
            <Text>Export Data</Text>
          </Button>
          <Button className="mb-2 w-full" variant="outline" onPress={handleImportData}>
            <Text>Import Data</Text>
          </Button>
          <Button className="w-full" variant="destructive" onPress={handleResetData}>
            <Text>Reset All Data</Text>
          </Button>
          <Text className="mt-2 text-center text-xs italic text-muted-foreground">
            Export your data before resetting
          </Text>
        </CardContent>
      </Card>
    ),
    [handleExportData, handleImportData, handleResetData]
  );

  const AboutCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between py-2">
            <Text className="font-medium">App Version:</Text>
            <Text className="text-primary">{appVersion}</Text>
          </View>
          <Button className="mt-3 w-full" variant="outline" onPress={handleTestSystemTheme}>
            <Text>Test System Theme Detection</Text>
          </Button>
        </CardContent>
      </Card>
    ),
    [appVersion, handleTestSystemTheme]
  );

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}>
      {AppearanceCard}

      {SyncSettingsCard}

      {CurrencyCard}

      {NotificationCard}

      {DataManagementCard}

      {AboutCard}
    </ScrollView>
  );
}
