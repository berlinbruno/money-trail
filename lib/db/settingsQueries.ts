import { AlertFrequency, AlertType } from '@/types/Alert';
import { TransactionCategory, TransactionMode, TransactionType } from '@/types/Transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteDatabase } from 'expo-sqlite';
import { createAlert } from './alertQueries';
import { insertTransaction } from './transactionQueries';

// AsyncStorage helper functions for settings
const SETTINGS_PREFIX = '@money_trail_settings:';

async function setSettingsValue(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SETTINGS_PREFIX}${key}`, value);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

async function getSettingsValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${SETTINGS_PREFIX}${key}`);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    throw error;
  }
}

// Helper functions for specific settings config values
export async function getAppTheme(): Promise<string> {
  return (await getSettingsValue('app_theme')) || 'system';
}

export async function setAppTheme(theme: string) {
  await setSettingsValue('app_theme', theme);
}

export async function getBackSync(): Promise<boolean> {
  const value = await getSettingsValue('back_sync');
  return value === 'true';
}

export async function setBackSync(enabled: boolean) {
  await setSettingsValue('back_sync', enabled.toString());
}

export async function getSyncInterval(): Promise<number> {
  const value = await getSettingsValue('sync_interval');
  return parseInt(value || '600', 10);
}

export async function setSyncInterval(intervalSeconds: number) {
  await setSettingsValue('sync_interval', intervalSeconds.toString());
}

export async function getCurrencyFormat(): Promise<string> {
  return (await getSettingsValue('currency_format')) || 'USD';
}

export async function setCurrencyFormat(currency: string) {
  await setSettingsValue('currency_format', currency);
}

export async function getPushNotification(): Promise<boolean> {
  const value = await getSettingsValue('push_notification');
  return value === 'true';
}

export async function setPushNotification(enabled: boolean) {
  await setSettingsValue('push_notification', enabled.toString());
}

export async function getLastSyncTime(): Promise<Date | null> {
  const value = await getSettingsValue('lastSmsSync');
  return value ? new Date(value) : null;
}

export async function setLastSyncTime(date: Date) {
  await setSettingsValue('lastSmsSync', date.toISOString());
}

export async function resetLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SETTINGS_PREFIX}lastSmsSync`);
    console.log('Last sync time reset successfully');
  } catch (error) {
    console.error('Error resetting last sync time:', error);
    throw error;
  }
}

// Initialize default settings configuration values if not present
export async function initializeAppConfig() {
  console.log('Initializing app configuration...');

  try {
    const settingsDefaults = [
      { key: 'app_theme', value: 'system' },
      { key: 'back_sync', value: 'true' },
      { key: 'sync_interval', value: '7200' }, // 120 minutes in seconds (2 hours)
      { key: 'currency_format', value: 'INR' },
      { key: 'push_notification', value: 'true' },
    ];

    for (const { key, value } of settingsDefaults) {
      const existingValue = await getSettingsValue(key);
      if (existingValue === null) {
        await setSettingsValue(key, value);
        console.log(`Set default setting: ${key} = ${value}`);
      } else {
        console.log(`Setting already exists: ${key} = ${existingValue}`);
      }
    }

    console.log('Settings configuration initialization completed');
  } catch (error) {
    console.error('Error initializing settings config:', error);
    throw error;
  }
}

/**
 * Reset all user data (transactions, alerts, notifications) but preserve config settings
 * Note: This function still requires a database parameter for clearing SQLite tables
 */
export async function resetAllData(db: SQLiteDatabase): Promise<void> {
  try {
    // Start transaction for atomic operation
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Clear all transactions
      await db.runAsync('DELETE FROM transactions');

      // Clear all alerts
      await db.runAsync('DELETE FROM alerts');

      // Clear all notifications
      await db.runAsync('DELETE FROM notifications');

      // Reset auto-increment sequences (optional, for clean IDs)
      await db.runAsync('DELETE FROM sqlite_sequence WHERE name = ?', ['transactions']);
      await db.runAsync('DELETE FROM sqlite_sequence WHERE name = ?', ['alerts']);
      await db.runAsync('DELETE FROM sqlite_sequence WHERE name = ?', ['notifications']);

      // Commit transaction
      await db.runAsync('COMMIT');

      console.log('Successfully reset all user data (preserving settings)');
    } catch (innerError) {
      // Rollback on error
      await db.runAsync('ROLLBACK');
      throw innerError;
    }
  } catch (error) {
    console.error('Error resetting data:', error);
    throw error;
  }
}

/**
 * Reset only settings data from AsyncStorage (lighter version without database)
 */
export async function resetSettingsOnly(): Promise<void> {
  try {
    await clearSettingsData();
    console.log('Successfully reset settings data');
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Get database information including table names and record counts
 */
export async function getDbInfo(db: SQLiteDatabase): Promise<{ table: string; count: number }[]> {
  try {
    // Get list of tables
    const tableResults = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_migrations%'"
    );

    const tables = tableResults.map((r) => r.name);
    const counts = await Promise.all(
      tables.map(async (table) => {
        const countResult = await db.getAllAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        return { table, count: countResult[0]?.count || 0 };
      })
    );

    return counts;
  } catch (error) {
    console.error('Error fetching DB info:', error);
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
 * Clear all data from database tables (more aggressive than resetAllData)
 */
export async function clearAllData(db: SQLiteDatabase): Promise<void> {
  try {
    // Get list of tables first
    const tableResults = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_migrations%'"
    );

    // Start a transaction for better performance and atomicity
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // First disable foreign keys to avoid constraint issues
      await db.runAsync('PRAGMA foreign_keys = OFF');

      // Define allowed table names for security
      const allowedTables = ['transactions', 'alerts', 'notifications', 'config'];

      // Delete all records from each table using safe table names
      for (const { name } of tableResults) {
        if (allowedTables.includes(name)) {
          // Use explicit table names for better security
          switch (name) {
            case 'transactions':
              await db.runAsync('DELETE FROM transactions');
              break;
            case 'alerts':
              await db.runAsync('DELETE FROM alerts');
              break;
            case 'notifications':
              await db.runAsync('DELETE FROM notifications');
              break;
            case 'config':
              await db.runAsync('DELETE FROM config');
              break;
            default:
              console.warn(`Skipping unknown table: ${name}`);
              continue;
          }

          // Reset SQLite sequences (for auto-increment PKs)
          try {
            await db.runAsync('DELETE FROM sqlite_sequence WHERE name = ?', [name]);
          } catch {
            // sqlite_sequence might not exist or be accessible
            console.log(`Note: Could not reset sequence for ${name}`);
          }
        }
      } // Re-enable foreign keys
      await db.runAsync('PRAGMA foreign_keys = ON');

      // Commit the transaction
      await db.runAsync('COMMIT');

      console.log('Successfully cleared all database records');
    } catch (innerError) {
      // If any error occurs, rollback the transaction
      await db.runAsync('ROLLBACK');
      throw innerError;
    }

    // Run VACUUM outside of transaction to reclaim storage space
    try {
      await db.runAsync('VACUUM');
    } catch (vacuumError) {
      console.warn('VACUUM failed, but data clearing was successful:', vacuumError);
    }

    // Also clear settings from AsyncStorage
    await clearSettingsData();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

// Constants for test data generation
const TRANSACTION_TYPES: TransactionType[] = ['debit', 'credit'];
const DEBIT_CATEGORIES: TransactionCategory[] = [
  'food',
  'grocery',
  'bills',
  'shopping',
  'travel',
  'other',
];
const CREDIT_CATEGORIES: TransactionCategory[] = ['salary', 'investments', 'refund', 'other'];
const SAMPLE_AMOUNTS = [10.99, 25.5, 100, 500, 1000, 1500, 2000];
const SAMPLE_DESCRIPTIONS = [
  'Lunch',
  'Uber ride',
  'Electric bill',
  'Movie tickets',
  'Monthly salary',
  'Birthday gift',
];
const TRANSACTION_MODES: TransactionMode[] = ['cash', 'card', 'upi', 'neft', 'other'];
const ALERT_TYPES: AlertType[] = ['income', 'spending'];
const ALERT_FREQUENCIES: AlertFrequency[] = ['weekly', 'monthly'];
const SAMPLE_THRESHOLDS = [500, 1000, 2000, 5000];

/**
 * Generate test data for development and debugging
 */
export async function generateTestData(db: SQLiteDatabase): Promise<void> {
  try {
    const now = new Date();

    // Generate transactions using constants
    for (let i = 0; i < 20; i++) {
      const type = TRANSACTION_TYPES[Math.floor(Math.random() * TRANSACTION_TYPES.length)];
      const categoryOptions = type === 'debit' ? DEBIT_CATEGORIES : CREDIT_CATEGORIES;
      const category = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
      const amount = SAMPLE_AMOUNTS[Math.floor(Math.random() * SAMPLE_AMOUNTS.length)];
      const description =
        SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)];
      const mode = TRANSACTION_MODES[Math.floor(Math.random() * TRANSACTION_MODES.length)];

      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const uniqueHash = `test_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 10)}`;

      await insertTransaction(db, {
        type,
        category,
        amount,
        title: description,
        date: date.toISOString(),
        created_at: new Date().toISOString(),
        account: 'Main Account',
        mode,
        source: 'manual',
        pending_approval: 0,
        sms_hash: uniqueHash,
      });
    }

    // Generate alerts using constants
    for (let i = 0; i < 8; i++) {
      const type = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
      const frequency = ALERT_FREQUENCIES[Math.floor(Math.random() * ALERT_FREQUENCIES.length)];
      const categoryOptions = type === 'income' ? CREDIT_CATEGORIES : DEBIT_CATEGORIES;
      const category = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
      const threshold = SAMPLE_THRESHOLDS[Math.floor(Math.random() * SAMPLE_THRESHOLDS.length)];

      await createAlert(db, {
        type,
        frequency,
        category,
        threshold,
        created_at: new Date().toISOString(),
      });
    }

    console.log('Successfully generated test data');
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
}
