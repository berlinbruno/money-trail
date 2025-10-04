import { PermissionDialog } from '@/components/dialogs';
import { ThemedContent } from '@/components/layout/ThemedContent';
import { AppProvider } from '@/contexts/AppProvider';
import { ToastProvider } from '@/contexts/ToastProvider';
import '@/global.css';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { initializeDatabase } from '@/lib/database/initialization';
import { SQLiteProvider } from 'expo-sqlite';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configure Reanimated logger to disable strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode to suppress shared value access warnings
});

export { ErrorBoundary } from 'expo-router';

function AppContent() {
  // Initialize app-level services
  const { permissionDialogProps, showPermissionDialog, setShowPermissionDialog } =
    useAppInitialization();

  return (
    <AppProvider>
      <ToastProvider>
        <ThemedContent />
        {permissionDialogProps && (
          <PermissionDialog
            open={showPermissionDialog}
            onOpenChange={setShowPermissionDialog}
            title={permissionDialogProps.title}
            description={permissionDialogProps.description}
            showSettingsButton={permissionDialogProps.showSettingsButton}
            isBlocking={permissionDialogProps.isBlocking}
          />
        )}
      </ToastProvider>
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="app.db" onInit={initializeDatabase}>
        <AppContent />
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
