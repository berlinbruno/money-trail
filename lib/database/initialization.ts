import type { SQLiteDatabase } from 'expo-sqlite';
import { initializeTables } from './db';
import { initializeAppConfig } from './settingsQueries';

/**
 * Comprehensive database initialization function
 * Handles table creation, configuration setup, and error handling
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    // Enable WAL mode for better concurrency
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Initialize database tables if they don't exist
    await initializeTables(db);

    // Initialize default configuration values
    await initializeAppConfig();

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't throw here to prevent app crash - let it continue with default behavior
    throw error;
  }
}
