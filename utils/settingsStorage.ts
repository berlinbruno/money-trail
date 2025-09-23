import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage helper functions for settings
const SETTINGS_PREFIX = '@money_trail_settings:';

/**
 * Set a settings value in AsyncStorage
 * @param key The setting key (without prefix)
 * @param value The value to store
 */
export async function setSettingsValue(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SETTINGS_PREFIX}${key}`, value);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get a settings value from AsyncStorage
 * @param key The setting key (without prefix)
 * @returns The stored value or null if not found
 */
export async function getSettingsValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${SETTINGS_PREFIX}${key}`);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all settings from AsyncStorage
 */
export async function clearSettingsData(): Promise<void> {
  try {
    // Get all keys that start with our settings prefix
    const allKeys = await AsyncStorage.getAllKeys();
    const settingsKeys = allKeys.filter((key) => key.startsWith(SETTINGS_PREFIX));

    if (settingsKeys.length > 0) {
      await AsyncStorage.multiRemove(settingsKeys);
      console.log(`Successfully cleared ${settingsKeys.length} settings from AsyncStorage`);
    } else {
      console.log('No settings found to clear');
    }
  } catch (error) {
    console.error('Error clearing settings data:', error);
    throw error;
  }
}

/**
 * Get all config records from AsyncStorage
 */
export async function getConfigRecords(): Promise<{ key: string; value: string }[]> {
  try {
    // Get all keys that start with our settings prefix
    const allKeys = await AsyncStorage.getAllKeys();
    const settingsKeys = allKeys.filter((key) => key.startsWith(SETTINGS_PREFIX));

    // Get all values for our settings keys
    const settingsItems = await AsyncStorage.multiGet(settingsKeys);

    return settingsItems.map(([key, value]) => ({
      key: key.replace(SETTINGS_PREFIX, ''), // Remove prefix for cleaner display
      value: value || '',
    }));
  } catch (error) {
    console.error('Error fetching config records:', error);
    throw error;
  }
}
