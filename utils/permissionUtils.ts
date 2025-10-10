import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

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

// Optional permissions that enhance functionality but aren't required
export const OPTIONAL_PERMISSIONS = [PermissionsAndroid.PERMISSIONS.READ_SMS];

// Critical permissions that are required for core app functionality (currently none)
export const CRITICAL_PERMISSIONS: string[] = [];

// Permission descriptions for user understanding
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'android.permission.READ_SMS':
    'Automatically track expenses from banking SMS messages. Without this, you can still manually add transactions.',
};

// Interface for permission results with detailed information
export interface PermissionResult {
  granted: string[];
  denied: string[];
  hasOptionalDenied: boolean;
  hasCriticalDenied: boolean;
  deniedOptionalNames: string[];
  deniedCriticalNames: string[];
  canProceed: boolean;
}

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
 * @returns Promise resolving to detailed permission results
 */
export async function requestAppPermissions(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') {
    return {
      granted: [...CRITICAL_PERMISSIONS, ...OPTIONAL_PERMISSIONS],
      denied: [],
      hasOptionalDenied: false,
      hasCriticalDenied: false,
      deniedOptionalNames: [],
      deniedCriticalNames: [],
      canProceed: true,
    };
  }

  const allPermissions = [...CRITICAL_PERMISSIONS, ...OPTIONAL_PERMISSIONS];
  const granted: string[] = [];
  const denied: string[] = [];

  for (const permission of allPermissions) {
    try {
      // Check if already granted
      const isGranted = await PermissionsAndroid.check(permission as any);

      if (isGranted) {
        granted.push(permission);
        continue;
      }

      // Update history before requesting
      await updatePermissionHistory(permission);

      // Request the permission without custom rationale to avoid built-in dialogs
      // Our custom dialog will handle the explanation
      const result = await PermissionsAndroid.request(permission as any);

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

  // Analyze results
  const hasOptionalDenied = denied.some((p) => OPTIONAL_PERMISSIONS.includes(p as any));
  const hasCriticalDenied = denied.some((p) => CRITICAL_PERMISSIONS.includes(p as any));
  const deniedOptionalNames = denied
    .filter((p) => OPTIONAL_PERMISSIONS.includes(p as any))
    .map((p) => PERMISSION_FRIENDLY_NAMES[p] || p);
  const deniedCriticalNames = denied
    .filter((p) => CRITICAL_PERMISSIONS.includes(p as any))
    .map((p) => PERMISSION_FRIENDLY_NAMES[p] || p);

  return {
    granted,
    denied,
    hasOptionalDenied,
    hasCriticalDenied,
    deniedOptionalNames,
    deniedCriticalNames,
    canProceed: !hasCriticalDenied, // App can proceed if no critical permissions denied
  };
}

/**
 * Open application settings
 */
export function openAppSettings(): Promise<boolean> {
  return Linking.openSettings()
    .then(() => true)
    .catch((err) => {
      console.error('Could not open settings:', err);
      return false;
    });
}

/**
 * Create permission dialog props for use with alert dialog components
 * @param results Permission results from requestAppPermissions
 * @returns Dialog configuration or null if no action needed
 */
export function createPermissionDialogProps(results: PermissionResult): {
  title: string;
  description: string;
  showSettingsButton: boolean;
  isBlocking: boolean;
} | null {
  if (results.canProceed && !results.hasOptionalDenied) {
    return null; // No dialog needed, all permissions granted
  }

  if (!results.canProceed) {
    // Critical permissions denied - blocking dialog
    return {
      title: 'Critical Permissions Required',
      description: `Money Trail requires ${results.deniedCriticalNames.join(', ')} to function properly. Without these permissions, the app cannot work correctly.`,
      showSettingsButton: true,
      isBlocking: true,
    };
  }

  if (results.hasOptionalDenied && results.deniedOptionalNames.length > 0) {
    // Optional permissions denied - informational dialog
    const smsPermissionDenied = results.denied.includes(PermissionsAndroid.PERMISSIONS.READ_SMS);

    if (smsPermissionDenied) {
      return {
        title: 'Limited Functionality',
        description:
          'Without SMS access, Money Trail cannot automatically track transactions from banking messages. You can still manually add transactions and use all other features.',
        showSettingsButton: true,
        isBlocking: false,
      };
    }

    return {
      title: 'Some Features Limited',
      description: `Some features related to ${results.deniedOptionalNames.join(', ')} will be limited. You can still use the core functionality of the app.`,
      showSettingsButton: true,
      isBlocking: false,
    };
  }

  return null;
}

/**
 * Check if SMS permission is granted
 * @returns Promise resolving to boolean indicating if SMS permission is available
 */
export async function hasSMSPermission(): Promise<boolean> {
  return checkPermission(PermissionsAndroid.PERMISSIONS.READ_SMS);
}

/**
 * Handle denied permissions with appropriate UI feedback (legacy function for compatibility)
 * @deprecated Use createPermissionDialogProps instead for better UX with alert dialogs
 */
export function handlePermissionResults(results: { granted: string[]; denied: string[] }): void {
  // Legacy function - now just logs the results
  console.log('Permission results:', results);
  console.warn(
    'handlePermissionResults is deprecated. Use createPermissionDialogProps for better UX.'
  );
}
