import { CURRENCY_OPTIONS, SYNC_INTERVALS } from '@/constants/settingsConstants';
import {
  getBackSync,
  getCurrencyFormat,
  getLastSyncTime,
  getPushNotification,
  getSyncInterval,
  resetLastSyncTime as resetLastSyncTimeQuery,
  setBackSync,
  setCurrencyFormat,
  setPushNotification,
  setSyncInterval,
} from '@/lib/db/settingsQueries';
import { updateTaskConfiguration } from '@/lib/smsBackgroundTask';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Types
type CurrencyType = (typeof CURRENCY_OPTIONS)[number];
type SyncIntervalType = (typeof SYNC_INTERVALS)[number];

interface SettingsState {
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
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const db = useSQLiteContext();

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

  // Load all settings from database
  const loadSettings = useCallback(
    async (isRefresh = false) => {
      try {
        setIsLoading(true);

        const [syncEnabled, syncIntervalSeconds, currencyCode, notificationsEnabled, lastSync] =
          await Promise.all([
            getBackSync(),
            getSyncInterval(),
            getCurrencyFormat(),
            getPushNotification(),
            getLastSyncTime(),
          ]);

        // Update all state
        setBackgroundSyncState(syncEnabled);
        setSyncIntervalState((syncIntervalSeconds / 60) as SyncIntervalType); // Convert seconds to minutes
        setSelectedCurrencyState(
          CURRENCY_OPTIONS.find((c) => c.code === currencyCode) || CURRENCY_OPTIONS[0]
        );
        setPushNotificationsState(notificationsEnabled);
        setLastSyncTime(lastSync);

        // Initialize background task configuration on first load
        if (!isRefresh) {
          try {
            await updateTaskConfiguration(db, {
              enabled: syncEnabled,
              intervalMinutes: (syncIntervalSeconds / 60) as SyncIntervalType, // Convert seconds to minutes
            });
            console.log('Background task configuration initialized');
          } catch (error) {
            console.error('Error initializing background task:', error);
            // Don't fail the entire settings load if background task setup fails
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [db]
  );

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Theme actions - now removed, handled by ThemeContext

  // Sync actions
  const setBackgroundSyncEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await setBackSync(enabled);
        setBackgroundSyncState(enabled);

        // Update background task configuration
        const success = await updateTaskConfiguration(db, {
          enabled,
          intervalMinutes: syncInterval,
        });

        if (!success) {
          console.error('Failed to update background task configuration');
          throw new Error('Failed to update background task configuration');
        } else {
          console.log(`Background sync ${enabled ? 'enabled' : 'disabled'}`);
        }
      } catch (error) {
        console.error('Error setting background sync:', error);
        throw error;
      }
    },
    [db, syncInterval]
  );

  const setSyncIntervalMinutes = useCallback(
    async (interval: SyncIntervalType) => {
      try {
        const intervalSeconds = interval * 60;
        await setSyncInterval(intervalSeconds);
        setSyncIntervalState(interval);

        // Update background task if sync is enabled
        if (backgroundSyncEnabled) {
          const success = await updateTaskConfiguration(db, {
            enabled: backgroundSyncEnabled,
            intervalMinutes: interval,
          });

          if (!success) {
            console.error('Failed to update background task interval');
            throw new Error('Failed to update background task interval');
          } else {
            console.log(`Background sync interval updated to ${interval} minutes`);
          }
        }
      } catch (error) {
        console.error('Error setting sync interval:', error);
        throw error;
      }
    },
    [backgroundSyncEnabled, db]
  );

  const resetLastSyncTime = useCallback(async () => {
    try {
      await resetLastSyncTimeQuery();
      setLastSyncTime(null);
    } catch (error) {
      console.error('Error resetting last sync time:', error);
      throw error;
    }
  }, []);

  // Currency actions
  const setCurrency = useCallback(async (currency: CurrencyType) => {
    try {
      await setCurrencyFormat(currency.code);
      setSelectedCurrencyState(currency);
    } catch (error) {
      console.error('Error setting currency:', error);
      throw error;
    }
  }, []);

  // Notification actions
  const setPushNotifications = useCallback(async (enabled: boolean) => {
    try {
      await setPushNotification(enabled);
      setPushNotificationsState(enabled);
    } catch (error) {
      console.error('Error setting push notifications:', error);
      throw error;
    }
  }, []);

  // General actions
  const refreshSettings = useCallback(async () => {
    await loadSettings(true); // Pass true to indicate this is a refresh, not initial load
  }, [loadSettings]);

  const contextValue: SettingsContextType = {
    // State
    backgroundSyncEnabled,
    syncInterval,
    lastSyncTime,
    selectedCurrency,
    pushNotificationsEnabled,
    isLoading,

    // Actions
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
