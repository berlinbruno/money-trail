import { useDialog } from '@/contexts/DialogProvider';
import { refreshSettingsGlobally } from '@/contexts/SettingsContext';
import { initializeTables } from '@/lib/database/db';
import {
  getAlertsWithProgress,
  insertAlertNotifications,
} from '@/lib/database/notificationQueries';
import { getFetchOnLaunch, setBackSync, setFetchOnLaunch } from '@/lib/database/settingsQueries';
import { initializeBackgroundTask } from '@/lib/sms/backgroundTask';
import { syncTransactions } from '@/lib/sms/sync';
import { initializeAppPermissions } from '@/utils/permissionInitializer';
import { createPermissionDialogProps, hasSMSPermission } from '@/utils/permissionUtils';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to handle app initialization logic
 * Manages permissions, background task setup, and optional SMS fetch on launch
 */
export const useAppInitialization = () => {
  const db = useSQLiteContext();
  const { showPermissionDialog } = useDialog();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database
      await initializeTables(db);

      // Request permissions and handle results
      const permissionResults = await initializeAppPermissions();

      if (permissionResults) {
        const dialogProps = createPermissionDialogProps(permissionResults);
        if (dialogProps) {
          showPermissionDialog({
            title: dialogProps.title,
            description: dialogProps.description,
            showSettingsButton: dialogProps.showSettingsButton,
            isBlocking: dialogProps.isBlocking,
          });
        }

        // App can continue if critical permissions not denied
        if (!permissionResults.canProceed) {
          setError('Critical permissions required to continue');
          setIsLoading(false);
          return;
        }
      }

      // Check SMS permission and disable SMS-dependent features if not available
      const hasSMSAccess = await hasSMSPermission();

      if (!hasSMSAccess) {
        console.log('SMS permission not granted - disabling SMS-dependent features');
        // Disable background sync and fetch on launch since they require SMS access
        await setBackSync(false);
        await setFetchOnLaunch(false);
      }

      // Initialize background task (will respect the SMS permission settings)
      const promise = Promise.resolve();
      await initializeBackgroundTask(promise);

      // Check if SMS fetch on launch is enabled and SMS permission is available
      const fetchOnLaunchEnabled = await getFetchOnLaunch();

      // Start SMS sync only if fetch on launch is enabled AND SMS permission is granted
      if (fetchOnLaunchEnabled && hasSMSAccess) {
        setTimeout(() => {
          syncTransactions(db, {
            onSyncComplete: () => {
              // Refresh settings when sync completes to update lastSyncTime
              refreshSettingsGlobally().catch(console.error);
            },
          }).catch(console.error);
        }, 100);
      }

      // Start alert notifications after a small delay to avoid transaction conflicts
      setTimeout(async () => {
        try {
          const alerts = await getAlertsWithProgress(db);
          await insertAlertNotifications(db, alerts);
        } catch (error) {
          console.warn('Alert notifications failed:', error);
        }
      }, 300);

      setIsInitialized(true);
    } catch (err) {
      console.error('App initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  }, [db, showPermissionDialog]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return {
    isInitialized,
    isLoading,
    error,
    retry: initializeApp,
  };
};
