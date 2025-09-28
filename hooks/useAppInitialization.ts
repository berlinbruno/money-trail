import { initializeBackgroundTask } from '@/lib/backgroundTaskSetup';
import {
  getAlertsWithProgress,
  insertAlertNotifications,
} from '@/lib/database/notificationQueries';
import { getFetchOnLaunch, getMessageScanCount } from '@/lib/database/settingsQueries';
import { syncTransactions } from '@/lib/sms/sync';
import { initializeAppPermissions } from '@/utils/permissionInitializer';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle app initialization logic
 * Manages permissions, background task setup, and optional SMS fetch on launch
 */
export function useAppInitialization() {
  const hasMounted = useRef(false);
  const db = useSQLiteContext();

  useEffect(() => {
    if (hasMounted.current) return;

    const initializeApp = async () => {
      try {
        // Initialize background task
        await initializeBackgroundTask();

        // Initialize permissions
        await initializeAppPermissions();

        // Initialize alerts and notifications
        console.log('Initializing alert notifications...');
        try {
          const alertsData = await getAlertsWithProgress(db);
          await insertAlertNotifications(db, alertsData);
          console.log('Alert notifications initialized successfully');
        } catch (error) {
          console.error('Failed to initialize alert notifications:', error);
          // Continue with app initialization even if notifications fail
        }

        // Check if fetch on launch is enabled
        const fetchOnLaunch = await getFetchOnLaunch();

        if (fetchOnLaunch) {
          console.log('Fetch on launch enabled, starting SMS sync...');

          // Wait a bit to ensure permissions are ready
          setTimeout(async () => {
            try {
              // Get the user's configured message scan count
              const messageScanCount = await getMessageScanCount();

              const result = await syncTransactions(db, {
                maxMessages: messageScanCount, // Use configured limit
              });

              console.log('Launch SMS sync completed:', {
                processed: result.processed,
                inserted: result.inserted,
                executionTime: result.executionTime,
                configuredLimit: messageScanCount,
              });
            } catch (error) {
              console.error('Launch SMS sync failed:', error);
              // Don't throw - allow app to continue
            }
          }, 1000);
        } else {
          console.log('Fetch on launch disabled');
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Don't throw - allow app to continue with reduced functionality
      }
    };

    initializeApp();
    hasMounted.current = true;
  }, [db]);
}
