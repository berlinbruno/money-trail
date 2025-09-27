import { Alert } from 'react-native';

/**
 * Initialize app permissions at startup
 * Handles permission requests and error scenarios gracefully
 */
export async function initializeAppPermissions(): Promise<void> {
  try {
    // Dynamic import for permission utilities to avoid circular dependencies
    const permissionUtils = await import('./permissionUtils');

    // Request all required app permissions
    const results = await permissionUtils.requestAppPermissions();

    // Handle any denied permissions with appropriate UI feedback
    permissionUtils.handlePermissionResults(results);
  } catch (error) {
    console.warn('Permission request error:', error);
    Alert.alert(
      'Permission Error',
      'There was an error requesting permissions. Some features may not work properly.'
    );
  }
}
