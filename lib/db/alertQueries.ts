import { Alert, AlertFrequency, AlertType, EditAlert, NewAlert } from '@/types/Alert';
import { TransactionType } from '@/types/Transaction';
import { getDateFormat } from '@/utils/dbUtils';
import { SQLiteDatabase } from 'expo-sqlite';

export async function fetchAlertsByTypeAndFrequency(
  db: SQLiteDatabase,
  type: AlertType,
  frequency: AlertFrequency
): Promise<Alert[]> {
  return db.getAllAsync(`SELECT * FROM alerts WHERE type = ? AND frequency = ?`, [type, frequency]);
}

export async function createAlert(db: SQLiteDatabase, newAlert: NewAlert): Promise<void> {
  await db.runAsync(
    `INSERT INTO alerts
      (type, frequency, category, threshold, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [newAlert.type, newAlert.frequency, newAlert.category, newAlert.threshold, newAlert.created_at]
  );
}

export async function updateAlert(db: SQLiteDatabase, updatedAlert: EditAlert): Promise<void> {
  await db.runAsync(
    `UPDATE alerts
     SET category = ?, threshold = ?, updated_at = ?
     WHERE id = ?`,
    [updatedAlert.category, updatedAlert.threshold, updatedAlert.updated_at, updatedAlert.id]
  );
}

export async function deleteAlert(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM alerts WHERE id = ?`, [id]);
}

export async function fetchTotalTransactionAmount(
  db: SQLiteDatabase,
  type: TransactionType,
  frequency?: AlertFrequency
): Promise<number> {
  let query = `SELECT SUM(amount) AS total_amount 
               FROM transactions
               WHERE type = ? AND pending_approval = 0`;
  const params: any[] = [type];

  if (frequency) {
    const dateFormat = getDateFormat(frequency);
    query += ` AND strftime('${dateFormat}', date) = strftime('${dateFormat}', 'now')`;
  }

  const result = (await db.getAllAsync(query, params)) as { total_amount: number | null }[];
  return result[0]?.total_amount ?? 0;
}
