import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

// Storage key for permission request history
const PERMISSION_REQUEST_HISTORY_KEY = 'permission_request_history';

// Interface for permission request history
interface PermissionRequestHistory {
  [key: string]: {
    lastRequested: number;
    requestCount: number;
  };
}

// Permission friendly names for UI display
export const PERMISSION_FRIENDLY_NAMES: Record<string, string> = {
  'android.permission.READ_SMS': 'Read SMS Messages',
  // Add other permissions as needed
};

// Critical permissions that are required for core app functionality
export const CRITICAL_PERMISSIONS = [PermissionsAndroid.PERMISSIONS.READ_SMS];

/**
 * Get permission request history from storage
 */
async function getPermissionHistory(): Promise<PermissionRequestHistory> {
  try {
    const historyString = await AsyncStorage.getItem(PERMISSION_REQUEST_HISTORY_KEY);
    return historyString ? JSON.parse(historyString) : {};
  } catch (error) {
    console.error('Error reading permission history:', error);
    return {};
  }
}

/**
 * Update permission request history
 * @param permission The permission that was requested
 */
async function updatePermissionHistory(permission: string): Promise<void> {
  try {
    const history = await getPermissionHistory();

    if (!history[permission]) {
      history[permission] = {
        lastRequested: Date.now(),
        requestCount: 1,
      };
    } else {
      history[permission].lastRequested = Date.now();
      history[permission].requestCount += 1;
    }

    await AsyncStorage.setItem(PERMISSION_REQUEST_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error updating permission history:', error);
  }
}

/**
 * Check if a permission has been granted
 * @param permission The permission to check
 * @returns Promise resolving to boolean indicating if permission is granted
 */
export async function checkPermission(permission: string): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const result = await PermissionsAndroid.check(permission as any);
    return result;
  } catch (error) {
    console.error(`Error checking permission ${permission}:`, error);
    return false;
  }
}

/**
 * Request multiple permissions with proper handling
 * @returns Promise resolving to object with granted and denied permissions
 */
export async function requestAppPermissions(): Promise<{ granted: string[]; denied: string[] }> {
  if (Platform.OS !== 'android') {
    return {
      granted: CRITICAL_PERMISSIONS as string[],
      denied: [],
    };
  }

  const permissions = CRITICAL_PERMISSIONS;
  const granted: string[] = [];
  const denied: string[] = [];

  for (const permission of permissions) {
    try {
      // Check if already granted
      const isGranted = await PermissionsAndroid.check(permission as any);

      if (isGranted) {
        granted.push(permission);
        continue;
      }

      // Update history before requesting
      await updatePermissionHistory(permission);

      // Create a rationale for the permission
      const rationale = {
        title: `${PERMISSION_FRIENDLY_NAMES[permission] || 'Permission'} Required`,
        message: `Money Trail needs access to ${PERMISSION_FRIENDLY_NAMES[permission] || 'this feature'} to function properly.`,
        buttonPositive: 'Grant Permission',
      };

      // Request the permission
      const result = await PermissionsAndroid.request(permission as any, rationale);

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        granted.push(permission);
      } else {
        denied.push(permission);
      }
    } catch (error) {
      console.error(`Error requesting permission ${permission}:`, error);
      denied.push(permission);
    }
  }

  return { granted, denied };
}

/**
 * Open application settings
 */
export function openAppSettings(): void {
  Linking.openSettings().catch((err) => {
    console.error('Could not open settings:', err);
    Alert.alert(
      'Unable to Open Settings',
      'Please open your device settings manually and grant the required permissions for Money Trail.'
    );
  });
}

/**
 * Handle denied permissions with appropriate UI feedback
 * @param results Permission results from requestAppPermissions
 */
export function handlePermissionResults(results: { granted: string[]; denied: string[] }): void {
  const { denied } = results;

  if (denied.length === 0) return;

  const hasCriticalDenied = denied.some((p) => CRITICAL_PERMISSIONS.includes(p as any));
  const deniedNames = denied.map((p) => PERMISSION_FRIENDLY_NAMES[p] || p).join(', ');

  if (hasCriticalDenied) {
    Alert.alert(
      'Critical Permissions Denied',
      `Money Trail requires ${deniedNames} to function properly. Without these permissions, some core features will not work.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: openAppSettings,
        },
      ]
    );
  } else {
    Alert.alert(
      'Some Permissions Denied',
      `Some features related to ${deniedNames} may be limited.`,
      [{ text: 'OK', style: 'default' }]
    );
  }
}
