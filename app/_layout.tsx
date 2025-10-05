import { ThemedContent } from '@/components/layout/ThemedContent';
import { AppProvider } from '@/contexts/AppProvider';
import '@/global.css';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { initializeDatabase } from '@/lib/database/initialization';
import { SQLiteProvider } from 'expo-sqlite';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Configure Reanimated logger to disable strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode to suppress shared value access warnings
});

export { ErrorBoundary } from 'expo-router';

function AppInitializer() {
  // Initialize app-level services (must be inside provider context)
  useAppInitialization();
  return null;
}

function AppContent() {
  return (
    <AppProvider>
      <AppInitializer />
      <ThemedContent />
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SQLiteProvider databaseName="app.db" onInit={initializeDatabase}>
          <AppContent />
        </SQLiteProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
