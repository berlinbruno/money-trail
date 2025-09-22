import { CURRENCY_OPTIONS, SYNC_INTERVALS, THEME_OPTIONS } from '@/constants/settingsConstants';
import {
  getAppTheme,
  getBackSync,
  getCurrencyFormat,
  getLastSyncTime,
  getPushNotification,
  getSyncInterval,
  resetLastSyncTime as resetLastSyncTimeQuery,
  setAppTheme,
  setBackSync,
  setCurrencyFormat,
  setPushNotification,
  setSyncInterval,
} from '@/lib/db/settingsQueries';
import { updateTaskConfiguration } from '@/lib/smsBackgroundTask';
import { SQLiteDatabase } from 'expo-sqlite';
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

// Types
type ThemeType = (typeof THEME_OPTIONS)[number];
type CurrencyType = (typeof CURRENCY_OPTIONS)[number];
type SyncIntervalType = (typeof SYNC_INTERVALS)[number];

interface SettingsState {
  // Theme settings
  theme: ThemeType;
  effectiveColorScheme: 'light' | 'dark';
  isThemeLoading: boolean;

  // Sync settings
  backgroundSyncEnabled: boolean;
  syncInterval: SyncIntervalType;
  lastSyncTime: Date | null;

  // Currency settings
  selectedCurrency: CurrencyType;

  // Notification settings
  pushNotificationsEnabled: boolean;

  // Loading states
  isLoading: boolean;
}

interface SettingsActions {
  // Theme actions
  setTheme: (theme: ThemeType) => Promise<void>;

  // Sync actions
  setBackgroundSyncEnabled: (enabled: boolean) => Promise<void>;
  setSyncIntervalMinutes: (interval: SyncIntervalType) => Promise<void>;
  resetLastSyncTime: () => Promise<void>;

  // Currency actions
  setCurrency: (currency: CurrencyType) => Promise<void>;

  // Notification actions
  setPushNotifications: (enabled: boolean) => Promise<void>;

  // General actions
  refreshSettings: () => Promise<void>;
}

type SettingsContextType = SettingsState & SettingsActions;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  database: SQLiteDatabase;
  children: React.ReactNode;
}

export function SettingsProvider({ database, children }: SettingsProviderProps) {
  // Theme state
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  // Sync state
  const [backgroundSyncEnabled, setBackgroundSyncState] = useState(false);
  const [syncInterval, setSyncIntervalState] = useState<SyncIntervalType>(120);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Currency state
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyType>(CURRENCY_OPTIONS[0]);

  // Notification state
  const [pushNotificationsEnabled, setPushNotificationsState] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // System theme detection
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const { setColorScheme } = useColorScheme();

  // Calculate effective color scheme
  const effectiveColorScheme = React.useMemo(() => {
    if (theme === 'system') {
      return systemColorScheme;
    }
    return theme === 'dark' ? 'dark' : 'light';
  }, [theme, systemColorScheme]);

  // Set nativewind color scheme
  useEffect(() => {
    setColorScheme(effectiveColorScheme);
  }, [effectiveColorScheme, setColorScheme]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    const currentScheme = Appearance.getColorScheme() || 'light';
    setSystemColorScheme(currentScheme);

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  // Load all settings from database
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsThemeLoading(true);

      const [
        savedTheme,
        syncEnabled,
        syncIntervalSeconds,
        currencyCode,
        notificationsEnabled,
        lastSync,
      ] = await Promise.all([
        getAppTheme(database),
        getBackSync(database),
        getSyncInterval(database),
        getCurrencyFormat(database),
        getPushNotification(database),
        getLastSyncTime(database),
      ]);

      // Set theme
      const validTheme = THEME_OPTIONS.includes(savedTheme as ThemeType)
        ? (savedTheme as ThemeType)
        : 'system';
      setThemeState(validTheme);

      // Set sync settings
      setBackgroundSyncState(syncEnabled);

      // Convert seconds to minutes and ensure it's a valid interval
      const intervalMinutes = Math.round(syncIntervalSeconds / 60);
      const validInterval = SYNC_INTERVALS.includes(intervalMinutes as SyncIntervalType)
        ? (intervalMinutes as SyncIntervalType)
        : 120;
      setSyncIntervalState(validInterval);

      // Set last sync time
      setLastSyncTime(lastSync);

      // Set currency
      const validCurrency =
        CURRENCY_OPTIONS.find((c) => c.code === currencyCode) || CURRENCY_OPTIONS[0];
      setSelectedCurrencyState(validCurrency);

      // Set notifications
      setPushNotificationsState(notificationsEnabled);

      setIsThemeLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsThemeLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Theme actions
  const setTheme = useCallback(
    async (newTheme: ThemeType) => {
      try {
        setIsThemeLoading(true);
        await setAppTheme(database, newTheme);
        setThemeState(newTheme);
      } catch (error) {
        console.error('Error setting theme:', error);
        throw error;
      } finally {
        setIsThemeLoading(false);
      }
    },
    [database]
  );

  // Sync actions
  const setBackgroundSyncEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await setBackSync(database, enabled);
        setBackgroundSyncState(enabled);

        // Update background task configuration
        const success = await updateTaskConfiguration(database, {
          enabled,
          intervalMinutes: syncInterval,
        });

        if (!success) {
          console.error('Failed to update background task configuration');
        } else {
          console.log(`Background sync ${enabled ? 'enabled' : 'disabled'}`);
        }
      } catch (error) {
        console.error('Error setting background sync:', error);
        throw error;
      }
    },
    [database, syncInterval]
  );

  const setSyncIntervalMinutes = useCallback(
    async (interval: SyncIntervalType) => {
      try {
        const intervalSeconds = interval * 60;
        await setSyncInterval(database, intervalSeconds);
        setSyncIntervalState(interval);

        // Update background task if sync is enabled
        if (backgroundSyncEnabled) {
          await updateTaskConfiguration(database, {
            enabled: backgroundSyncEnabled,
            intervalMinutes: interval,
          });
        }
      } catch (error) {
        console.error('Error setting sync interval:', error);
        throw error;
      }
    },
    [database, backgroundSyncEnabled]
  );

  const resetLastSyncTime = useCallback(async () => {
    try {
      await resetLastSyncTimeQuery(database);
      setLastSyncTime(null);
    } catch (error) {
      console.error('Error resetting last sync time:', error);
      throw error;
    }
  }, [database]);

  // Currency actions
  const setCurrency = useCallback(
    async (currency: CurrencyType) => {
      try {
        await setCurrencyFormat(database, currency.code);
        setSelectedCurrencyState(currency);
      } catch (error) {
        console.error('Error setting currency:', error);
        throw error;
      }
    },
    [database]
  );

  // Notification actions
  const setPushNotifications = useCallback(
    async (enabled: boolean) => {
      try {
        await setPushNotification(database, enabled);
        setPushNotificationsState(enabled);
      } catch (error) {
        console.error('Error setting push notifications:', error);
        throw error;
      }
    },
    [database]
  );

  // General actions
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const contextValue: SettingsContextType = {
    // State
    theme,
    effectiveColorScheme,
    isThemeLoading,
    backgroundSyncEnabled,
    syncInterval,
    lastSyncTime,
    selectedCurrency,
    pushNotificationsEnabled,
    isLoading,

    // Actions
    setTheme,
    setBackgroundSyncEnabled,
    setSyncIntervalMinutes,
    resetLastSyncTime,
    setCurrency,
    setPushNotifications,
    refreshSettings,
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
