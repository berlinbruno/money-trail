import {
  CURRENCY_OPTIONS,
  MESSAGE_SCAN_COUNTS,
  SYNC_INTERVALS,
} from '@/constants/settingsConstants';
import { useDialog } from '@/contexts/DialogProvider';
import {
  getAutoApproval,
  getBackSync,
  getCurrencyFormat,
  getFetchOnLaunch,
  getLastSyncTime,
  getMessageScanCount,
  getPushNotification,
  getSyncInterval,
  resetLastSyncTime as resetLastSyncTimeQuery,
  setAutoApproval,
  setBackSync,
  setCurrencyFormat,
  setFetchOnLaunch,
  setMessageScanCount as setMessageScanCountQuery,
  setPushNotification,
  setSyncInterval,
} from '@/lib/database/settingsQueries';
import { updateTaskConfiguration } from '@/lib/sms/backgroundTask';
import { hasSMSPermission } from '@/utils/permissionUtils';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Types
type CurrencyType = (typeof CURRENCY_OPTIONS)[number];
type SyncIntervalType = (typeof SYNC_INTERVALS)[number];
type MessageScanCountType = (typeof MESSAGE_SCAN_COUNTS)[number];

interface SettingsState {
  // Sync settings
  backgroundSyncEnabled: boolean;
  syncInterval: SyncIntervalType;
  messageScanCount: MessageScanCountType;
  lastSyncTime: Date | null;

  // App behavior settings
  fetchOnLaunch: boolean;
  autoApproval: boolean;

  // Currency settings
  selectedCurrency: CurrencyType;

  // Notification settings
  pushNotificationsEnabled: boolean;

  // Permission status
  hasSMSAccess: boolean;

  // Loading states
  isLoading: boolean;
}

interface SettingsActions {
  // Sync actions
  setBackgroundSyncEnabled: (enabled: boolean) => Promise<boolean>;
  setSyncIntervalMinutes: (interval: SyncIntervalType) => Promise<void>;
  setMessageScanCount: (count: MessageScanCountType) => Promise<void>;
  resetLastSyncTime: () => Promise<void>;

  // App behavior actions
  setFetchOnLaunchEnabled: (enabled: boolean) => Promise<boolean>;
  setAutoApprovalEnabled: (enabled: boolean) => Promise<void>;

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
  const { showPermissionDialog } = useDialog();

  // Sync state
  const [backgroundSyncEnabled, setBackgroundSyncState] = useState(false);
  const [syncInterval, setSyncIntervalState] = useState<SyncIntervalType>(120);
  const [messageScanCount, setMessageScanCountState] = useState<MessageScanCountType>(200);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // App behavior state
  const [fetchOnLaunch, setFetchOnLaunchState] = useState(true);
  const [autoApproval, setAutoApprovalState] = useState(false);

  // Currency state
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyType>(CURRENCY_OPTIONS[0]);

  // Notification state
  const [pushNotificationsEnabled, setPushNotificationsState] = useState(false);

  // Permission state
  const [hasSMSAccess, setHasSMSAccess] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Load all settings from database
  const loadSettings = useCallback(
    async (isRefresh = false) => {
      try {
        setIsLoading(true);

        const [
          syncEnabled,
          syncIntervalMinutes,
          messageScanCountValue,
          currencyCode,
          notificationsEnabled,
          lastSync,
          fetchOnLaunchEnabled,
          autoApprovalEnabled,
          smsAccess,
        ] = await Promise.all([
          getBackSync(),
          getSyncInterval(),
          getMessageScanCount(),
          getCurrencyFormat(),
          getPushNotification(),
          getLastSyncTime(),
          getFetchOnLaunch(),
          getAutoApproval(),
          hasSMSPermission(),
        ]);

        // Update all state
        setBackgroundSyncState(syncEnabled && smsAccess); // Disable if no SMS access
        setSyncIntervalState(syncIntervalMinutes as SyncIntervalType); // Already in minutes
        setMessageScanCountState(messageScanCountValue as MessageScanCountType);
        setSelectedCurrencyState(
          CURRENCY_OPTIONS.find((c) => c.code === currencyCode) || CURRENCY_OPTIONS[0]
        );
        setPushNotificationsState(notificationsEnabled);
        setLastSyncTime(lastSync);
        setFetchOnLaunchState(fetchOnLaunchEnabled && smsAccess); // Disable if no SMS access
        setAutoApprovalState(autoApprovalEnabled);
        setHasSMSAccess(smsAccess);

        // Initialize background task configuration on first load
        if (!isRefresh) {
          try {
            await updateTaskConfiguration(db, {
              enabled: syncEnabled,
              intervalMinutes: syncIntervalMinutes as SyncIntervalType, // Already in minutes
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
    async (enabled: boolean): Promise<boolean> => {
      try {
        // Check SMS permission before enabling
        if (enabled && !hasSMSAccess) {
          showPermissionDialog({
            title: 'SMS Permission Required',
            description:
              'Background sync requires SMS access to automatically track transactions from banking messages. Please grant SMS permission in app settings to enable this feature.',
            showSettingsButton: true,
            isBlocking: false,
          });
          return false; // Return false to indicate operation failed
        }

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

        return true; // Return true to indicate success
      } catch (error) {
        console.error('Error setting background sync:', error);
        throw error;
      }
    },
    [db, syncInterval, hasSMSAccess, showPermissionDialog]
  );

  const setSyncIntervalMinutes = useCallback(
    async (interval: SyncIntervalType) => {
      try {
        await setSyncInterval(interval); // Already in minutes
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

  const setMessageScanCount = useCallback(
    async (count: MessageScanCountType) => {
      try {
        await setMessageScanCountQuery(count);
        setMessageScanCountState(count);

        // Update background task configuration if sync is enabled
        if (backgroundSyncEnabled) {
          const success = await updateTaskConfiguration(db, {
            enabled: backgroundSyncEnabled,
            intervalMinutes: syncInterval,
          });

          if (!success) {
            console.error('Failed to update background task message scan count');
            throw new Error('Failed to update background task message scan count');
          } else {
            console.log(`Background sync message scan count updated to ${count} messages`);
          }
        }
      } catch (error) {
        console.error('Error setting message scan count:', error);
        throw error;
      }
    },
    [backgroundSyncEnabled, db, syncInterval]
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

  // App behavior actions
  const setFetchOnLaunchEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      try {
        // Check SMS permission before enabling
        if (enabled && !hasSMSAccess) {
          showPermissionDialog({
            title: 'SMS Permission Required',
            description:
              'Fetch on launch requires SMS access to automatically track transactions when the app starts. Please grant SMS permission in app settings to enable this feature.',
            showSettingsButton: true,
            isBlocking: false,
          });
          return false; // Return false to indicate operation failed
        }

        await setFetchOnLaunch(enabled);
        setFetchOnLaunchState(enabled);

        return true; // Return true to indicate success
      } catch (error) {
        console.error('Error setting fetch on launch:', error);
        throw error;
      }
    },
    [hasSMSAccess, showPermissionDialog]
  );

  const setAutoApprovalEnabled = useCallback(async (enabled: boolean) => {
    try {
      await setAutoApproval(enabled);
      setAutoApprovalState(enabled);
    } catch (error) {
      console.error('Error setting auto approval:', error);
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
    messageScanCount,
    lastSyncTime,
    fetchOnLaunch,
    autoApproval,
    selectedCurrency,
    pushNotificationsEnabled,
    hasSMSAccess,
    isLoading,

    // Actions
    setBackgroundSyncEnabled,
    setSyncIntervalMinutes,
    setMessageScanCount,
    resetLastSyncTime,
    setFetchOnLaunchEnabled,
    setAutoApprovalEnabled,
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
