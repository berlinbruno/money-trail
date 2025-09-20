import '@/global.css';

import { BACKGROUND_TASK_IDENTIFIER, BACKGROUND_TASK_OPTIONS } from '@/lib/smsBackgroundTask';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as BackgroundTask from 'expo-background-task';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const hasMounted = useRef(false);

  // We don't need to register the task here - it's done in smsBackgroundTask.ts
  // This will help ensure we don't have multiple task registrations
  useEffect(() => {
    // Just verify the task is registered at app start
    const checkBackgroundTask = async () => {
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
        if (!isRegistered) {
          console.log('Background task not registered in app start, registering now');
          await BackgroundTask.registerTaskAsync(
            BACKGROUND_TASK_IDENTIFIER,
            BACKGROUND_TASK_OPTIONS
          );
        } else {
          console.log('Background task already registered');
        }
      } catch (error) {
        console.error('Error checking background task status:', error);
      }
    };

    checkBackgroundTask();
  }, []);

  useEffect(() => {
    if (hasMounted.current) return;

    const requestPermissions = async () => {
      try {
        // Dynamic import for permission utilities
        const permissionUtils = await import('@/utils/permissionUtils');

        // Request all required app permissions
        const results = await permissionUtils.requestAppPermissions();

        // Handle any denied permissions with appropriate UI feedback
        permissionUtils.handlePermissionResults(results);
      } catch (err) {
        console.warn('Permission request error:', err);
        Alert.alert(
          'Permission Error',
          'There was an error requesting permissions. Some features may not work properly.'
        );
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
          <Stack.Screen name="debug" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
