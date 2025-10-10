import {
  ConfigRecordsCard,
  DataManagementCard,
  DatabaseInfoCard,
  SystemInfoCard,
} from '@/components/debug';
import { APP_VERSION } from '@/constants/settingsConstants';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/contexts/DialogProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastProvider';
import {
  clearAllData,
  generateTestAlerts,
  generateTestTransactions,
  getConfigRecords,
  getDbInfo,
} from '@/lib/database/settingsQueries';
import { useTheme } from '@react-navigation/native';
import * as Device from 'expo-device';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView } from 'react-native';

export default function DebugScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useDialog();
  const { state: appState, actions: appActions } = useApp();
  const { refreshSettings } = useSettings();
  const [dbInfo, setDbInfo] = useState<{ table: string; count: number }[]>([]);
  const [configRecords, setConfigRecords] = useState<{ key: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);

  const appVersion = useMemo(() => APP_VERSION, []);

  // Memoize device info to avoid recalculation
  const deviceInfo = useMemo(() => {
    return {
      platform: `${Platform.OS} ${Platform.Version}`,
      isAndroid: Platform.OS === 'android',
    };
  }, []);

  // Fetch DB information (stable version without toast for initial load)
  const fetchDbInfoSilent = useCallback(async () => {
    setIsLoading(true);
    try {
      const counts = await getDbInfo(db);
      setDbInfo(counts);

      // Fetch config table records
      const configResult = await getConfigRecords();
      setConfigRecords(configResult);
    } catch (error) {
      console.error('Error fetching DB info:', error);
      // Don't show toast on initial load - only log the error
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Fetch DB information (version with error toast for manual actions)
  const fetchDbInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const counts = await getDbInfo(db);
      setDbInfo(counts);

      // Fetch config table records
      const configResult = await getConfigRecords();
      setConfigRecords(configResult);
    } catch (error) {
      console.error('Error fetching DB info:', error);
      showToast('Failed to fetch database information');
    } finally {
      setIsLoading(false);
    }
  }, [db, showToast]);

  // Generate test data handlers
  const handleGenerateTestTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestTransactions(db);
      showToast('Test transactions created');
      // Trigger comprehensive data updates across the app
      appActions.triggerTransactionDataUpdate();
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test transactions:', error);
      showToast('Failed to create test transactions');
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showToast, appActions]);

  const handleGenerateTestAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestAlerts(db);
      showToast('Test alerts created');
      // Trigger alerts and dashboard updates
      appActions.triggerAlertsRefresh();
      appActions.triggerDashboardDataUpdate();
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test alerts:', error);
      showToast('Failed to create test alerts');
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showToast, appActions]);

  // Optimized memory usage check
  const checkMemoryUsage = useCallback(async () => {
    try {
      const memoryInfo: any = {
        timestamp: new Date().toISOString(),
        deviceInfo: deviceInfo.platform,
      };

      // Get device information efficiently
      try {
        const deviceTypeResult = Device.getDeviceTypeAsync
          ? await Device.getDeviceTypeAsync()
          : null;

        Object.assign(memoryInfo, {
          deviceName: Device.deviceName || 'Unknown',
          deviceModel: Device.modelName || 'Unknown Model',
          deviceType: deviceTypeResult === Device.DeviceType?.PHONE ? 'Phone' : 'Tablet',
          brand: Device.brand || 'Unknown Brand',
          osName: Device.osName || Platform.OS,
          osVersion: Device.osVersion || Platform.Version.toString(),
          isDevice: Device.isDevice ? 'Physical Device' : 'Emulator/Simulator',
        });

        if (deviceInfo.isAndroid) {
          try {
            const constants = Platform.constants as any;
            if (constants?.Release) {
              memoryInfo.androidRelease = constants.Release;
            }
          } catch {
            // Ignore android constants errors
          }
        }

        memoryInfo.note = 'Memory usage metrics require native modules with additional permissions';
      } catch (deviceError) {
        console.error('Error getting device metrics:', deviceError);
        memoryInfo.deviceError = 'Some device metrics unavailable';
      }

      setMemoryUsage(memoryInfo);
    } catch (error) {
      console.error('Error checking device info:', error);
      setMemoryUsage({
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve device information',
        errorDetails: error instanceof Error ? error.message : String(error),
      });
    }
  }, [deviceInfo]);

  // Clear all data
  const handleClearAllData = useCallback(() => {
    showConfirmationDialog({
      title: 'Confirm Data Reset',
      description:
        'This will delete ALL transaction, alert, and notification records, and reset all settings to their default values. This action cannot be undone.',
      confirmText: 'Reset',
      confirmVariant: 'destructive',
      loadingText: 'Resetting all data...',
      onConfirm: async () => {
        try {
          await clearAllData(db);
          // Refresh settings to update lastSyncTime and other settings display
          await refreshSettings();
          showToast('Database reset complete');
          // Trigger global refresh to update all app sections
          appActions.triggerGlobalRefresh();
          fetchDbInfo();
        } catch (error) {
          console.error('Reset error:', error);
          showToast('Database reset failed');
          throw error; // Let the dialog handle the error state
        }
      },
    });
  }, [db, showToast, fetchDbInfo, showConfirmationDialog, appActions, refreshSettings]);

  // Manual refresh with silent operation
  const handleManualRefresh = useCallback(async () => {
    try {
      await fetchDbInfo();
      await checkMemoryUsage();
      // No success toast for pull-to-refresh - it's a common action
    } catch {
      // Error already handled in fetchDbInfo if needed
    }
  }, [fetchDbInfo, checkMemoryUsage]);

  // Initialize data on mount
  useEffect(() => {
    fetchDbInfoSilent();
    checkMemoryUsage();
  }, [fetchDbInfoSilent, checkMemoryUsage]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={isLoading || appState.isRefreshing}
          onRefresh={handleManualRefresh}
          colors={[theme.colors.background]}
          tintColor={theme.colors.primary}
        />
      }>
      <DatabaseInfoCard dbInfo={dbInfo} />

      <DataManagementCard
        onGenerateTestTransactions={handleGenerateTestTransactions}
        onGenerateTestAlerts={handleGenerateTestAlerts}
        onClearAllData={handleClearAllData}
      />

      <ConfigRecordsCard configRecords={configRecords} />

      <SystemInfoCard memoryUsage={memoryUsage} appVersion={appVersion} />
    </ScrollView>
  );
}
