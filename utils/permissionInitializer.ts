import type { PermissionResult } from './permissionUtils';

/**
 * Initialize app permissions at startup
 * Handles permission requests and error scenarios gracefully
 * @returns Permission results for UI handling
 */
export async function initializeAppPermissions(): Promise<PermissionResult | null> {
  try {
    // Dynamic import for permission utilities to avoid circular dependencies
    const permissionUtils = await import('./permissionUtils');

    // Request all required app permissions
    const results = await permissionUtils.requestAppPermissions();

    // Return results for the caller to handle UI
    return results;
  } catch (error) {
    console.warn('Permission request error:', error);

    // Return a safe default that allows the app to continue
    return {
      granted: [],
      denied: [],
      hasOptionalDenied: false,
      hasCriticalDenied: false,
      deniedOptionalNames: [],
      deniedCriticalNames: [],
      canProceed: true,
    };
  }
}
