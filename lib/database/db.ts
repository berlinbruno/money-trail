// src/lib/db.ts
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'app.db';

export async function openDB() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // optional: WAL mode for better concurrency
  await db.execAsync('PRAGMA journal_mode = WAL;');
  return db;
}

export async function initializeTables(db: SQLite.SQLiteDatabase) {
  try {
    // Create alerts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income','spending')),
        frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly')),
        category TEXT NOT NULL CHECK(category IN (
          'food','grocery','bills','shopping','travel','fuel','rent','other',
          'salary','investments','refund'
        )),
        threshold REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `);

    // Create config table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('transaction','alert','system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium' 
          CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info', 'success')),
        is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `);

    // Create transactions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account TEXT NOT NULL DEFAULT 'default',
        type TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'other' CHECK(mode IN ('upi','neft','imps','card','cash','other')),
        category TEXT NOT NULL CHECK(category IN (
          'food','grocery','bills','shopping','travel','fuel','rent','other',
          'salary','investments','refund'
        )),
        sms_hash TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        source TEXT CHECK(source IN ('manual','sms','api')),
        pending_approval INTEGER NOT NULL DEFAULT 0 CHECK(pending_approval IN (0,1))
      )
    `);

    console.log('All database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}
