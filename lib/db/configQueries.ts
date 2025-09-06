import { SQLiteDatabase } from 'expo-sqlite';

export async function setConfig(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO config (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`,
    [key, value]
  );
}

export async function getConfig(db: SQLiteDatabase, key: string): Promise<string | null> {
  return db.getFirstAsync(`SELECT value FROM config WHERE key=?`, [key]);
}
