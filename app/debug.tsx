import {
  ConfigRecordsCard,
  DataManagementCard,
  DatabaseInfoCard,
  SystemInfoCard,
} from '@/components/debug';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { APP_VERSION } from '@/constants/settingsConstants';
import { useToast } from '@/contexts/ToastProvider';
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
import { Platform, RefreshControl, ScrollView } from 'react-native';

export default function DebugScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
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
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test transactions:', error);
      showToast('Failed to create test transactions');
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showToast]);

  const handleGenerateTestAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestAlerts(db);
      showToast('Test alerts created');
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test alerts:', error);
      showToast('Failed to create test alerts');
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo, showToast]);

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
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearAllData(db);
      showToast('Database reset complete');
      fetchDbInfo();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Reset error:', error);
      showToast('Database reset failed');
    } finally {
      setIsLoading(false);
    }
  }, [db, showToast, fetchDbInfo]);

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
      <DatabaseInfoCard dbInfo={dbInfo} />

      <DataManagementCard
        onGenerateTestTransactions={handleGenerateTestTransactions}
        onGenerateTestAlerts={handleGenerateTestAlerts}
        onClearAllData={() => setShowClearDialog(true)}
      />

      <ConfigRecordsCard configRecords={configRecords} />

      <SystemInfoCard memoryUsage={memoryUsage} appVersion={appVersion} />

      {/* Clear All Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Confirm Data Reset"
        description="This will delete ALL transaction, alert, and notification records, and reset all settings to their default values. This action cannot be undone."
        confirmText="Reset"
        confirmVariant="destructive"
        loadingText="Resetting all data..."
        onConfirm={handleClearAllData}
      />
    </ScrollView>
  );
}
