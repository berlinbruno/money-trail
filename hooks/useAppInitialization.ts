import { initializeBackgroundTask } from '@/lib/backgroundTaskSetup';
import { initializeTables } from '@/lib/database/db';
import {
  getAlertsWithProgress,
  insertAlertNotifications,
} from '@/lib/database/notificationQueries';
import { syncTransactions } from '@/lib/sms/sync';
import { initializeAppPermissions } from '@/utils/permissionInitializer';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to handle app initialization logic
 * Manages permissions, background task setup, and optional SMS fetch on launch
 */
export const useAppInitialization = () => {
  const db = useSQLiteContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database
      await initializeTables(db);

      // Request permissions
      await initializeAppPermissions();

      // Initialize background task
      await initializeBackgroundTask();

      // Start SMS sync first
      setTimeout(() => {
        syncTransactions(db).catch(console.error);
      }, 100);

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
  }, [db]);

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
