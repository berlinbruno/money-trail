import {
  ConfigRecordsCard,
  DataManagementCard,
  DatabaseInfoCard,
  NavigationCard,
  SystemInfoCard,
} from '@/components/debug';
import { APP_VERSION } from '@/constants/settingsConstants';
import { useToastHelpers } from '@/contexts/ToastProvider';
import {
  clearAllData,
  generateTestAlerts,
  generateTestTransactions,
  getConfigRecords,
  getDbInfo,
} from '@/lib/database/settingsQueries';
import * as Device from 'expo-device';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView } from 'react-native';

export default function DebugScreen() {
  const db = useSQLiteContext();
  const { showSuccess, showError } = useToastHelpers();
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
      showError({
        title: 'Database Error',
        description: 'Failed to fetch database information',
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, showError]);

  // Show config detail - wrapped in useCallback for optimization
  const showConfigDetail = useCallback((config: { key: string; value: string }) => {
    Alert.alert(`Config: ${config.key}`, config.value, [{ text: 'Close', onPress: () => {} }]);
  }, []);

  // Generate test data handlers
  const handleGenerateTestTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestTransactions(db);
      showSuccess({
        title: 'Test Transactions Created',
        description: 'Sample transaction data generated for testing',
      });
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test transactions:', error);
      showError({
        title: 'Generation Failed',
        description: 'Unable to create test transactions',
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showSuccess, showError]);

  const handleGenerateTestAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestAlerts(db);
      showSuccess({
        title: 'Test Alerts Created',
        description: 'Sample alert data generated for testing',
      });
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test alerts:', error);
      showError({
        title: 'Generation Failed',
        description: 'Unable to create test alerts',
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showSuccess, showError]);

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
  const handleClearAllData = async () => {
    Alert.alert(
      'Confirm Data Reset',
      'This will delete ALL transaction, alert, and notification records, and reset all settings to their default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await clearAllData(db);
              showSuccess({
                title: 'Database Reset',
                description: 'All data cleared and settings reset to defaults',
              });
              fetchDbInfo();
            } catch (error) {
              console.error('Reset error:', error);
              showError({
                title: 'Reset Failed',
                description: 'Unable to reset database. Please try again.',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

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
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleManualRefresh} />}>
      <NavigationCard />

      <DatabaseInfoCard dbInfo={dbInfo} />

      <DataManagementCard
        onGenerateTestTransactions={handleGenerateTestTransactions}
        onGenerateTestAlerts={handleGenerateTestAlerts}
        onClearAllData={handleClearAllData}
      />

      <ConfigRecordsCard configRecords={configRecords} onConfigDetail={showConfigDetail} />

      <SystemInfoCard memoryUsage={memoryUsage} appVersion={appVersion} />
    </ScrollView>
  );
}
