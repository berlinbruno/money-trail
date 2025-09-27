import { ALERT_FREQUENCIES, ALERT_TYPES } from '@/constants/alertsConstants';
import {
  SAMPLE_AMOUNTS,
  SAMPLE_DESCRIPTIONS,
  SAMPLE_THRESHOLDS,
} from '@/constants/testDataConstants';
import {
  CREDIT_CATEGORIES,
  DEBIT_CATEGORIES,
  TRANSACTION_MODES,
  TRANSACTION_TYPE,
} from '@/constants/transactionConstants';
import {
  clearSettingsData,
  getConfigRecords,
  getSettingsValue,
  setSettingsValue,
} from '@/utils/settingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteDatabase } from 'expo-sqlite';
import { createAlert } from './alertQueries';
import { insertTransaction } from './transactionQueries';

// Re-export utility functions for backward compatibility
export { clearSettingsData, getConfigRecords };

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
  return parseInt(value || '120', 10); // Default 120 minutes (2 hours)
}

export async function setSyncInterval(intervalMinutes: number) {
  await setSettingsValue('sync_interval', intervalMinutes.toString());
}

export async function getMessageScanCount(): Promise<number> {
  const value = await getSettingsValue('message_scan_count');
  return parseInt(value || '200', 10);
}

export async function setMessageScanCount(count: number) {
  await setSettingsValue('message_scan_count', count.toString());
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
    await AsyncStorage.removeItem('@money_trail_settings:lastSmsSync');
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
      { key: 'sync_interval', value: '120' }, // 120 minutes (2 hours)
      { key: 'message_scan_count', value: '200' }, // Default 200 messages
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

/**
 * Generate test data for development and debugging
 */
export async function generateTestData(db: SQLiteDatabase): Promise<void> {
  try {
    const now = new Date();

    // Generate transactions using constants
    for (let i = 0; i < 20; i++) {
      const type = TRANSACTION_TYPE[Math.floor(Math.random() * TRANSACTION_TYPE.length)];
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

/**
 * Insert realistic dummy data for demonstration purposes
 */
export async function insertDummyData(db: SQLiteDatabase): Promise<void> {
  try {
    // --- Transactions ---
    await db.execAsync(`
      INSERT INTO transactions (account, type, title, amount, date, mode, category, source, pending_approval)
      VALUES 
        ('HDFC', 'debit', 'Grocery Shopping', 1200, '2025-08-15', 'upi', 'grocery', 'manual', 0),
        ('HDFC', 'credit', 'Salary', 50000, '2025-08-01', 'other', 'salary', 'manual', 0),
        ('ICICI', 'debit', 'Fuel', 3000, '2025-08-10', 'card', 'fuel', 'manual', 0),
        ('ICICI', 'debit', 'Rent', 15000, '2025-08-01', 'neft', 'rent', 'manual', 0),
        ('HDFC', 'credit', 'Investment Refund', 2000, '2025-08-05', 'other', 'refund', 'api', 0);
    `);

    // --- Alerts ---
    await db.execAsync(`
      INSERT INTO alerts (type, frequency, category, threshold)
      VALUES
        ('income', 'monthly', 'salary', 50000),
        ('income', 'monthly', 'investments', 10000),
        ('spending', 'weekly', 'grocery', 2000),
        ('spending', 'monthly', 'rent', 15000),
        ('spending', 'weekly', 'fuel', 1500);
    `);

    // --- Notifications ---
    await db.execAsync(`
      INSERT INTO notifications (type, title, message, severity, is_read)
      VALUES
        ('transaction', 'New Transaction', '1200 spent on Grocery Shopping.', 'medium', 0),
        ('transaction', 'New Transaction', '50000 received as Salary.', 'success', 0),
        ('alert', 'Income Alert', 'You have reached 100% of your salary goal.', 'high', 0),
        ('alert', 'Spending Alert', 'You have used 85% of your grocery weekly budget.', 'high', 0),
        ('system', 'Welcome', 'Welcome to your finance tracker app!', 'info', 1);
    `);

    console.log('Successfully inserted dummy data');
  } catch (error) {
    console.error('Error inserting dummy data:', error);
    throw error;
  }
}
