import { initializeBackgroundTask } from '@/lib/backgroundTaskSetup';
import { initializeAppPermissions } from '@/utils/permissionInitializer';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle app initialization logic
 * Manages permissions and background task setup with proper lifecycle
 */
export function useAppInitialization() {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;

    const initializeApp = async () => {
      // Initialize background task
      await initializeBackgroundTask();

      // Initialize permissions
      await initializeAppPermissions();
    };

    initializeApp();
    hasMounted.current = true;
  }, []);
}
