import { ThemedContent } from '@/components/layout/ThemedContent';
import { AppProvider } from '@/contexts/AppProvider';
import '@/global.css';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { initializeDatabase } from '@/lib/database/initialization';
import { SQLiteProvider } from 'expo-sqlite';
import React from 'react';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configure Reanimated logger to disable strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode to suppress shared value access warnings
});

export { ErrorBoundary } from 'expo-router';

function AppContent() {
  // Initialize app-level services
  useAppInitialization();

  return (
    <AppProvider>
      <ThemedContent />
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="app.db" onInit={initializeDatabase}>
      <AppContent />
    </SQLiteProvider>
  );
}
