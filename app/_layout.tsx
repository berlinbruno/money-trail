import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import '@/global.css';

import { initializeAppConfig } from '@/lib/db/settingsQueries';
import { BACKGROUND_TASK_IDENTIFIER, BACKGROUND_TASK_OPTIONS } from '@/lib/smsBackgroundTask';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as BackgroundTask from 'expo-background-task';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configure Reanimated logger to disable strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode to suppress shared value access warnings
});

export { ErrorBoundary } from 'expo-router';

// Themed content component that responds to theme context
function ThemedAppContent() {
  const { colorScheme, isThemeLoading } = useTheme();

  // Only block rendering during initial theme loading to prevent navigation unmounting
  if (isThemeLoading) {
    return null; // Only for initial theme loading
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="backgroundScreen"
          options={{ headerShown: true, title: 'Background Tasks' }}
        />
        <Stack.Screen name="debugScreen" options={{ headerShown: true, title: 'Debug' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}

// App component with both theme and settings contexts
function AppWithProviders() {
  return (
    <AppThemeProvider>
      <SettingsProvider>
        <ThemedAppContent />
      </SettingsProvider>
    </AppThemeProvider>
  );
}

export default function RootLayout() {
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
      onInit={async (db) => {
        try {
          // Enable WAL mode for better concurrency
          await db.execAsync('PRAGMA journal_mode = WAL;');

          // Initialize default configuration values
          await initializeAppConfig();

          console.log('Database initialization completed successfully');
        } catch (error) {
          console.error('Database initialization error:', error);
          // Don't throw here to prevent app crash - let it continue with default behavior
        }
      }}>
      <AppWithProviders />
    </SQLiteProvider>
  );
}
