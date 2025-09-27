import {
  ConfigRecordsCard,
  DataManagementCard,
  DatabaseInfoCard,
  SystemInfoCard,
} from '@/components/debug';
import { APP_VERSION } from '@/constants/settingsConstants';
import {
  clearAllData,
  generateTestData,
  getConfigRecords,
  getDbInfo,
} from '@/lib/database/settingsQueries';
import * as Device from 'expo-device';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, ToastAndroid } from 'react-native';

// Platform-specific message helper
const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Debug Info', message);
  }
};

export default function DebugScreen() {
  const db = useSQLiteContext();
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

  // Fetch DB information
  const fetchDbInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const counts = await getDbInfo(db);
      setDbInfo(counts);

      // Fetch config table records
      const configResult = await getConfigRecords();
      setConfigRecords(configResult);

      showMessage('Database info updated');
    } catch (error) {
      console.error('Error fetching DB info:', error);
      Alert.alert('Error', 'Failed to fetch database information');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Show config detail - wrapped in useCallback for optimization
  const showConfigDetail = useCallback((config: { key: string; value: string }) => {
    Alert.alert(`Config: ${config.key}`, config.value, [{ text: 'Close', onPress: () => {} }]);
  }, []);

  // Generate test data with optimized random selection
  const handleGenerateTestData = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateTestData(db);
      showMessage('Test data generated successfully');
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test data:', error);
      Alert.alert('Error', 'Failed to generate test data');
    } finally {
      setIsLoading(false);
    }
  }, [db, fetchDbInfo]);

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
      'This will delete ALL data from the database tables, but keep the table structure. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await clearAllData(db);
              showMessage('Database records cleared successfully');
              fetchDbInfo();
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Reset Failed', 'Could not reset database');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Initialize data on mount
  useEffect(() => {
    fetchDbInfo();
    checkMemoryUsage();
  }, [fetchDbInfo, checkMemoryUsage]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            fetchDbInfo();
            checkMemoryUsage();
          }}
        />
      }>
      <DatabaseInfoCard dbInfo={dbInfo} />

      <DataManagementCard
        onGenerateTestData={handleGenerateTestData}
        onClearAllData={handleClearAllData}
      />

      <ConfigRecordsCard configRecords={configRecords} onConfigDetail={showConfigDetail} />

      <SystemInfoCard memoryUsage={memoryUsage} appVersion={appVersion} />
    </ScrollView>
  );
}
