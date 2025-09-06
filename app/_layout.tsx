import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as BackgroundTask from 'expo-background-task';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export { ErrorBoundary } from 'expo-router';

const BACKGROUND_TASK_NAME = 'smsSyncTask';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const hasMounted = useRef(false);

  useEffect(() => {
    BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 240, // minutes
    });
  }, []);

  useEffect(() => {
    if (hasMounted.current) return;

    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          // Define all permissions needed for the app
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          ];

          // Request permissions with rationale
          const results = await PermissionsAndroid.requestMultiple(permissions);

          // Check permission results and handle accordingly
          const deniedPermissions = Object.entries(results)
            .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
            .map(([permission]) => permission.split('.').pop());

          if (deniedPermissions.length > 0) {
            // SMS permissions are critical for app functionality
            if (
              deniedPermissions.includes('READ_SMS') ||
              deniedPermissions.includes('RECEIVE_SMS')
            ) {
              Alert.alert(
                'Critical Permissions Denied',
                'SMS access is required for transaction detection. Please enable these permissions in your device settings to use all features.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Settings',
                    onPress: () => {
                      // This would typically open app settings
                      // Using alert for demonstration since direct settings navigation
                      // requires additional native modules
                      Alert.alert(
                        'Action Required',
                        'Please open your device settings and enable the required permissions for Money Trail.'
                      );
                    },
                  },
                ]
              );
            } else {
              // Non-critical permissions
              Alert.alert(
                'Some Permissions Denied',
                'Some features may be limited. You can enable these permissions later in settings if needed.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        } catch (err) {
          console.warn('Permission request error:', err);
          Alert.alert(
            'Permission Error',
            'There was an error requesting permissions. Some features may not work properly.'
          );
        }
      } else if (Platform.OS === 'ios') {
        // iOS doesn't have SMS permissions but would handle other permissions here
        // This is a placeholder for other iOS-specific permissions
      }
    };

    requestPermissions();
    hasMounted.current = true;
  }, []);

  return (
    <SQLiteProvider
      databaseName="app.db"
      assetSource={{ assetId: require('@/assets//database/app.db') }}
      onInit={async (db) => {
        await db.execAsync('PRAGMA journal_mode = WAL;');
      }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="backgroundScreen" />
          <Stack.Screen name="debugScreen" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
