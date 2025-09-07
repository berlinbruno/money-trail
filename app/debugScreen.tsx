import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { createAlert } from '@/lib/db/alertQueries';
import { insertTransaction } from '@/lib/db/transactionQueries';
import { AlertFrequency, AlertType } from '@/types/Alert';
import { TransactionCategory, TransactionMode, TransactionType } from '@/types/Transaction';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

// Try to import Device, but handle errors gracefully
let Device: any = null;
try {
  // Dynamic import to handle potential module loading issues
  import('expo-device')
    .then((module) => {
      Device = module;
    })
    .catch((err) => {
      console.error('Error loading expo-device:', err);
    });
} catch (error) {
  console.error('Failed to import expo-device:', error);
}

// Helper to show toast/alert across platforms
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
  const [appVersion] = useState('1.0.0');
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch DB information
  const fetchDbInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get list of tables
      const tableResults = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_migrations%'"
      );

      const tables = tableResults.map((r) => r.name);
      const counts = await Promise.all(
        tables.map(async (table) => {
          const countResult = await db.getAllAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${table}`
          );
          return { table, count: countResult[0]?.count || 0 };
        })
      );

      setDbInfo(counts);

      // Fetch config table records
      if (tables.includes('config')) {
        const configResult = await db.getAllAsync<{ key: string; value: string }>(
          'SELECT key, value FROM config'
        );
        setConfigRecords(configResult);
      }

      showMessage('Database info updated');
    } catch (error) {
      console.error('Error fetching DB info:', error);
      Alert.alert('Error', 'Failed to fetch database information');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Show config detail
  const showConfigDetail = (config: { key: string; value: string }) => {
    Alert.alert(`Config: ${config.key}`, config.value, [{ text: 'Close', onPress: () => {} }]);
  };

  // Generate test data
  const generateTestData = async () => {
    setIsLoading(true);
    try {
      // Create sample transactions
      const transactionTypes: TransactionType[] = ['debit', 'credit'];
      const debitCategories: TransactionCategory[] = [
        'food',
        'grocery',
        'bills',
        'shopping',
        'travel',
        'other',
      ];
      const creditCategories: TransactionCategory[] = ['salary', 'investments', 'refund', 'other'];
      const amounts = [10.99, 25.5, 100, 500, 1000, 1500, 2000];
      const descriptions = [
        'Lunch',
        'Uber ride',
        'Electric bill',
        'Movie tickets',
        'Monthly salary',
        'Birthday gift',
      ];
      const modes: TransactionMode[] = ['cash', 'card', 'upi', 'neft', 'other'];

      const now = new Date();

      // Generate 20 random transactions spanning last 30 days
      for (let i = 0; i < 20; i++) {
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        // Choose appropriate categories based on transaction type
        const categoryOptions = type === 'debit' ? debitCategories : creditCategories;
        const category = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const mode = modes[Math.floor(Math.random() * modes.length)];

        // Random date within last 30 days
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        // Generate a unique hash for each transaction to avoid UNIQUE constraint failures
        const uniqueHash = `test_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 10)}`;

        await insertTransaction(db, {
          type,
          category,
          amount,
          title: description,
          date: date.toISOString(),
          created_at: new Date().toISOString(),
          account: 'Main Account',
          mode,
          source: 'manual',
          pending_approval: 0,
          sms_hash: uniqueHash,
        });
      }

      // Create sample alerts
      const alertTypes: AlertType[] = ['income', 'spending'];
      const frequencies: AlertFrequency[] = ['weekly', 'monthly'];
      const thresholds = [500, 1000, 2000, 5000];

      for (let i = 0; i < 8; i++) {
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        const categoryOptions = type === 'income' ? creditCategories : debitCategories;
        const category = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        const threshold = thresholds[Math.floor(Math.random() * thresholds.length)];

        await createAlert(db, {
          type,
          frequency,
          category,
          threshold,
          created_at: new Date().toISOString(),
        });
      }

      showMessage('Test data generated successfully');
      // Refresh DB info after generating data
      fetchDbInfo();
    } catch (error) {
      console.error('Error generating test data:', error);
      Alert.alert('Error', 'Failed to generate test data');
    } finally {
      setIsLoading(false);
    }
  };

  // Check memory usage
  const checkMemoryUsage = async () => {
    try {
      // Create memory usage object
      const memoryInfo: any = {
        timestamp: new Date().toISOString(),
      };

      // Add device information
      memoryInfo.deviceInfo = `${Platform.OS} ${Platform.Version}`;

      // Get device information using expo-device
      try {
        memoryInfo.deviceName = Device.deviceName || 'Unknown';
        memoryInfo.deviceModel = Device.modelName || 'Unknown Model';
        memoryInfo.deviceType = Device.getDeviceTypeAsync
          ? (await Device.getDeviceTypeAsync()) === Device.DeviceType.PHONE
            ? 'Phone'
            : 'Tablet'
          : 'Unknown Type';
        memoryInfo.brand = Device.brand || 'Unknown Brand';
        memoryInfo.osName = Device.osName || Platform.OS;
        memoryInfo.osVersion = Device.osVersion || Platform.Version.toString();

        // Add memory information (not directly available in expo-device)
        memoryInfo.totalMemory = 'Not available through expo-device';
        memoryInfo.isDevice = Device.isDevice ? 'Physical Device' : 'Emulator/Simulator';

        // Get memory if available through the OS
        if (Platform.OS === 'android' && Platform.constants) {
          if (Platform.constants.Release) {
            memoryInfo.androidRelease = Platform.constants.Release;
          }
        }

        // Add a note about memory API limitations
        memoryInfo.note = 'Memory usage metrics require native modules with additional permissions';
      } catch (deviceError) {
        console.error('Error getting device metrics:', deviceError);
        memoryInfo.deviceError = 'Some device metrics unavailable';
      }

      setMemoryUsage(memoryInfo);
    } catch (error) {
      console.error('Error checking device info:', error);
      const fallbackInfo = {
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve device information',
        errorDetails: error instanceof Error ? error.message : String(error),
      };
      setMemoryUsage(fallbackInfo);
    }
  };

  // Clear all data
  const clearAllData = async () => {
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
              // Get list of tables
              const tableResults = await db.getAllAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_migrations%'"
              );

              // Start a transaction for better performance and atomicity
              await db.runAsync('BEGIN TRANSACTION');

              try {
                // First disable foreign keys to avoid constraint issues
                await db.runAsync('PRAGMA foreign_keys = OFF');

                // Delete all records from each table
                for (const { name } of tableResults) {
                  await db.runAsync(`DELETE FROM ${name}`);

                  // Reset SQLite sequences (for auto-increment PKs)
                  try {
                    await db.runAsync(`DELETE FROM sqlite_sequence WHERE name='${name}'`);
                  } catch {
                    // sqlite_sequence might not exist or be accessible
                    console.log(`Note: Could not reset sequence for ${name}`);
                  }
                }

                // Re-enable foreign keys
                await db.runAsync('PRAGMA foreign_keys = ON');

                // Commit the transaction
                await db.runAsync('COMMIT');

                // Run VACUUM to reclaim storage space (must be outside transaction)
                await db.runAsync('VACUUM');

                showMessage('Database records cleared successfully');
              } catch (error) {
                // If any error occurs, rollback the transaction
                await db.runAsync('ROLLBACK');
                throw error;
              }
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

  // Fetch DB info on initial load
  useEffect(() => {
    fetchDbInfo();
  }, [fetchDbInfo]);

  return (
    <View className="flex-1 bg-background p-4">
      <StatusBar style="auto" />

      <Text className="mb-4 text-center text-2xl font-bold">Money Trail Debugger</Text>

      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-background/70">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <ScrollView className="flex-1">
        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text className="mb-3 text-lg font-semibold">Database Information</Text>
          <View className="mb-4">
            {dbInfo.map((item, index) => (
              <View key={index} className="flex-row justify-between border-b border-border py-2">
                <Text className="flex-1 font-medium">{item.table}</Text>
                <Text className="text-primary">{item.count} records</Text>
              </View>
            ))}
          </View>
          <Button className="mt-2" onPress={fetchDbInfo}>
            <Text>Refresh DB Info</Text>
          </Button>
        </View>

        {/* Config Table Records */}
        {configRecords.length > 0 && (
          <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
            <Text className="mb-2 text-lg font-semibold">Config Records</Text>
            <Text className="mb-1 text-muted-foreground">
              (Tap on a record to see full details)
            </Text>
            <View className="mb-4">
              <View className="flex-row justify-between border-b-2 border-border bg-muted py-2">
                <Text className="flex-1 font-bold">Key</Text>
                <Text className="flex-2 pl-2 font-bold">Value</Text>
              </View>
              {configRecords.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row justify-between border-b border-border py-2"
                  onPress={() => showConfigDetail(item)}>
                  <Text className="flex-1 font-medium">{item.key}</Text>
                  <Text
                    className="flex-2 pl-2 text-muted-foreground"
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {item.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              className="mt-2"
              onPress={async () => {
                try {
                  const timestamp = new Date().toISOString();
                  const configKey = `test_config_${Date.now() % 10000}`;
                  const configValue = `Test value created at ${timestamp}`;

                  // Insert the new config record
                  const query = 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)';
                  const params = [configKey, configValue];
                  await db.runAsync(query, params);

                  fetchDbInfo();
                  showMessage('Test config added');
                } catch (error) {
                  console.error('Error adding test config:', error);
                  Alert.alert('Error', 'Failed to add test configuration');
                }
              }}>
              <Text>Add Test Config</Text>
            </Button>
          </View>
        )}

        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text className="mb-3 text-lg font-semibold">Data Management</Text>
          <View className="mb-2">
            <Button className="mb-2" onPress={generateTestData}>
              <Text>Generate Test Data</Text>
            </Button>
          </View>
          <View className="mb-2">
            <Button className="mb-1" variant="destructive" onPress={clearAllData}>
              <Text>Clear All Records</Text>
            </Button>
            <Text className="text-center text-xs italic text-destructive">
              (Preserves table structure)
            </Text>
          </View>
        </View>

        <Button className="mb-4" variant="secondary" onPress={() => setShowAdvanced(!showAdvanced)}>
          <Text>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}</Text>
        </Button>

        {showAdvanced && (
          <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
            <Text className="mb-3 text-lg font-semibold">System Information</Text>
            <Text className="mb-1">App Version: {appVersion}</Text>

            <Button
              className="my-2"
              onPress={() => {
                setIsLoading(true);
                checkMemoryUsage().finally(() => setIsLoading(false));
              }}>
              <Text>Check Memory Usage</Text>
            </Button>

            {memoryUsage && (
              <View className="mt-2 rounded-md bg-muted p-3">
                <Text className="mb-3 font-medium">Timestamp: {memoryUsage.timestamp}</Text>

                <Text className="mb-2 font-semibold">Device Information</Text>
                {memoryUsage.deviceInfo && (
                  <Text className="mb-1">OS: {memoryUsage.deviceInfo}</Text>
                )}
                {memoryUsage.deviceName && (
                  <Text className="mb-1">Device Name: {memoryUsage.deviceName}</Text>
                )}
                {memoryUsage.deviceModel && (
                  <Text className="mb-1">Model: {memoryUsage.deviceModel}</Text>
                )}
                {memoryUsage.brand && <Text className="mb-1">Brand: {memoryUsage.brand}</Text>}
                {memoryUsage.deviceType && (
                  <Text className="mb-1">Device Type: {memoryUsage.deviceType}</Text>
                )}
                {memoryUsage.isDevice && (
                  <Text className="mb-1">Environment: {memoryUsage.isDevice}</Text>
                )}

                <Text className="mb-2 mt-3 font-semibold">System Information</Text>
                {memoryUsage.osName && <Text className="mb-1">OS Name: {memoryUsage.osName}</Text>}
                {memoryUsage.osVersion && (
                  <Text className="mb-1">OS Version: {memoryUsage.osVersion}</Text>
                )}
                {memoryUsage.androidRelease && (
                  <Text className="mb-1">Android Release: {memoryUsage.androidRelease}</Text>
                )}
                {memoryUsage.totalMemory && (
                  <Text className="mb-1">Memory: {memoryUsage.totalMemory}</Text>
                )}

                {memoryUsage.deviceError && (
                  <Text className="mt-2 text-xs italic text-amber-500">
                    Note: {memoryUsage.deviceError}
                  </Text>
                )}

                {memoryUsage.note && (
                  <Text className="mt-2 text-xs italic text-muted-foreground">
                    {memoryUsage.note}
                  </Text>
                )}

                {memoryUsage.error && (
                  <Text className="mt-2 text-xs text-destructive">Error: {memoryUsage.error}</Text>
                )}

                {memoryUsage.errorDetails && (
                  <Text className="text-xs text-destructive">{memoryUsage.errorDetails}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
