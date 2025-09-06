// src/lib/db.ts
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'app.db';

export async function openDB() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // optional: WAL mode for better concurrency
  await db.execAsync('PRAGMA journal_mode = WAL;');
  return db;
}

export async function migrateSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`DROP TABLE IF EXISTS alerts;`);
  await db.execAsync(`DROP TABLE IF EXISTS transactions;`);
  await db.execAsync(`DROP TABLE IF EXISTS notifications;`);
}
