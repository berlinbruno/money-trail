import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
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

  // Memoized components for better performance
  const DatabaseInfoCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
        </CardHeader>
        <CardContent>
          {dbInfo.map((item, index) => (
            <View key={index} className="flex-row justify-between border-b border-border py-2">
              <Text className="flex-1 font-medium">{item.table}</Text>
              <Text className="text-primary">{item.count} records</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    ),
    [dbInfo]
  );

  const ConfigRecordsCard = useMemo(() => {
    if (configRecords.length === 0) return null;

    return (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Config Records</CardTitle>
          <CardDescription>(Tap on a record to see full details)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header Row */}
          <View className="flex-row border-b-2 border-border bg-muted">
            <Text className="flex-1 p-2 font-bold">Key</Text>
            <Text className="flex-1 p-2 font-bold">Value</Text>
          </View>

          {/* Data Rows */}
          {configRecords.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row border-b border-border"
              onPress={() => showConfigDetail(item)}>
              <View className="flex-1 p-2">
                <Text className="font-medium">{item.key}</Text>
              </View>
              <View className="flex-1 p-2">
                <Text className="text-muted-foreground" numberOfLines={2} ellipsizeMode="tail">
                  {item.value}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </CardContent>
      </Card>
    );
  }, [configRecords, showConfigDetail]);

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
      {DatabaseInfoCard}

      <Card className="m-2">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="mb-2" onPress={handleGenerateTestData}>
            <Text>Generate Test Data</Text>
          </Button>
          <Button variant="destructive" onPress={handleClearAllData}>
            <Text>Clear All Records</Text>
          </Button>
          <Text className="mt-1 text-center text-xs italic text-destructive">
            (Preserves table structure)
          </Text>
        </CardContent>
      </Card>

      {ConfigRecordsCard}

      <Card className="m-2">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        {memoryUsage ? (
          <CardContent>
            <Text className="mb-1">App Version: {appVersion}</Text>
            {memoryUsage.deviceName && (
              <Text className="mb-1">Device: {memoryUsage.deviceName}</Text>
            )}
            {memoryUsage.deviceModel && (
              <Text className="mb-1">Model: {memoryUsage.deviceModel}</Text>
            )}
            {memoryUsage.brand && <Text className="mb-1">Brand: {memoryUsage.brand}</Text>}
            {memoryUsage.deviceType && <Text className="mb-1">Type: {memoryUsage.deviceType}</Text>}
            {memoryUsage.isDevice && (
              <Text className="mb-1">Environment: {memoryUsage.isDevice}</Text>
            )}
            {memoryUsage.osName && <Text className="mb-1">OS: {memoryUsage.osName}</Text>}
            {memoryUsage.osVersion && (
              <Text className="mb-1">OS Version: {memoryUsage.osVersion}</Text>
            )}
            {memoryUsage.androidRelease && (
              <Text className="mb-1">Android Release: {memoryUsage.androidRelease}</Text>
            )}
            {memoryUsage.deviceInfo && (
              <Text className="mb-1">Platform: {memoryUsage.deviceInfo}</Text>
            )}

            {memoryUsage.deviceError && (
              <Text className="mt-2 text-xs italic text-amber-500">
                Note: {memoryUsage.deviceError}
              </Text>
            )}

            {memoryUsage.note && (
              <Text className="mt-2 text-xs italic text-muted-foreground">{memoryUsage.note}</Text>
            )}

            {memoryUsage.error && (
              <Text className="mt-2 text-xs text-destructive">Error: {memoryUsage.error}</Text>
            )}

            {memoryUsage.errorDetails && (
              <Text className="text-xs text-destructive">{memoryUsage.errorDetails}</Text>
            )}
          </CardContent>
        ) : (
          <View className="mt-2 rounded-md bg-muted p-3">
            <Text className="text-muted-foreground">Loading system information...</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
