import { AlertFrequency, AlertType } from '@/types/Alert';
import { TransactionCategory, TransactionMode, TransactionType } from '@/types/Transaction';
import { SQLiteDatabase } from 'expo-sqlite';
import { createAlert } from './alertQueries';
import { getConfig, setConfig } from './configQueries';
import { insertTransaction } from './transactionQueries';

// Helper functions for specific settings config values
export async function getAppTheme(db: SQLiteDatabase): Promise<string> {
  return (await getConfig(db, 'app_theme')) || 'system';
}

export async function setAppTheme(db: SQLiteDatabase, theme: string) {
  await setConfig(db, 'app_theme', theme);
}

export async function getBackSync(db: SQLiteDatabase): Promise<boolean> {
  const value = await getConfig(db, 'back_sync');
  return value === 'true';
}

export async function setBackSync(db: SQLiteDatabase, enabled: boolean) {
  await setConfig(db, 'back_sync', enabled.toString());
}

export async function getSyncInterval(db: SQLiteDatabase): Promise<number> {
  const value = await getConfig(db, 'sync_interval');
  return parseInt(value || '600', 10);
}

export async function setSyncInterval(db: SQLiteDatabase, intervalSeconds: number) {
  await setConfig(db, 'sync_interval', intervalSeconds.toString());
}

export async function getCurrencyFormat(db: SQLiteDatabase): Promise<string> {
  return (await getConfig(db, 'currency_format')) || 'USD';
}

export async function setCurrencyFormat(db: SQLiteDatabase, currency: string) {
  await setConfig(db, 'currency_format', currency);
}

export async function getPushNotification(db: SQLiteDatabase): Promise<boolean> {
  const value = await getConfig(db, 'push_notification');
  return value === 'true';
}

export async function setPushNotification(db: SQLiteDatabase, enabled: boolean) {
  await setConfig(db, 'push_notification', enabled.toString());
}

export async function getLastSyncTime(db: SQLiteDatabase): Promise<Date | null> {
  const value = await getConfig(db, 'lastSmsSync');
  return value ? new Date(value) : null;
}

export async function setLastSyncTime(db: SQLiteDatabase, date: Date) {
  await setConfig(db, 'lastSmsSync', date.toISOString());
}

export async function resetLastSyncTime(db: SQLiteDatabase): Promise<void> {
  try {
    await db.runAsync('DELETE FROM config WHERE key = ?', ['lastSmsSync']);
    console.log('Last sync time reset successfully');
  } catch (error) {
    console.error('Error resetting last sync time:', error);
    throw error;
  }
}

// Initialize default settings configuration values if not present
export async function initializeAppConfig(db: SQLiteDatabase) {
  console.log('Initializing app configuration...');

  try {
    const settingsDefaults = [
      { key: 'app_theme', value: 'system' },
      { key: 'back_sync', value: 'true' },
      { key: 'sync_interval', value: '600' }, // 10 minutes in seconds
      { key: 'currency_format', value: 'INR' },
      { key: 'push_notification', value: 'true' },
    ];

    for (const { key, value } of settingsDefaults) {
      const existingValue = await getConfig(db, key);
      if (existingValue === null) {
        await setConfig(db, key, value);
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
 * Get all config records from the config table
 */
export async function getConfigRecords(
  db: SQLiteDatabase
): Promise<{ key: string; value: string }[]> {
  try {
    const configResult = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM config'
    );
    return configResult;
  } catch (error) {
    console.error('Error fetching config records:', error);
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
