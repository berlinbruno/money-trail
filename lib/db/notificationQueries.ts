// lib/db/alerts.ts
import { IAlertRow, INotificationRow } from '@/types/Common';
import { SQLiteDatabase } from 'expo-sqlite';

export async function insertAlertNotifications(db: SQLiteDatabase, alerts: IAlertRow[]) {
  for (const alert of alerts) {
    if (alert.progress < 50) continue; // skip minor progress

    const cappedProgress = Math.min(alert.progress, 100);
    let message = '';
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';

    if (alert.type === 'income') {
      if (cappedProgress >= 100) {
        message = `Goal Achieved: You've reached ₹${alert.threshold.toLocaleString()} in income for "${alert.category}" (${cappedProgress}%).`;
        severity = 'high';
      } else if (cappedProgress >= 85) {
        message = `Great! You're at ${cappedProgress}% of your income goal ₹${alert.threshold.toLocaleString()} for "${alert.category}".`;
        severity = 'medium';
      } else {
        message = `You're at ${cappedProgress}% of your ₹${alert.threshold.toLocaleString()} income goal for "${alert.category}".`;
        severity = 'low';
      }
    } else {
      // spending alerts
      if (cappedProgress >= 100) {
        message = `Overspent: You've exceeded your ₹${alert.threshold.toLocaleString()} limit for "${alert.category}" (${cappedProgress}%).`;
        severity = 'critical';
      } else if (cappedProgress >= 85) {
        message = `Warning: You're at ${cappedProgress}% of your ₹${alert.threshold.toLocaleString()} spending limit for "${alert.category}".`;
        severity = 'high';
      } else {
        message = `You've used ${cappedProgress}% of your ₹${alert.threshold.toLocaleString()} spending limit for "${alert.category}".`;
        severity = 'medium';
      }
    }
    await db.execAsync(`
  INSERT INTO notifications (type, title, message, severity, is_read)
  VALUES (
    'alert',
    '${alert.type === 'income' ? 'Income Alert' : 'Spending Alert'}',
    '${message.replace(/'/g, "''")}',
    '${severity}',
    0
  );
`);
  }
}

export async function getAlertsWithProgress(db: SQLiteDatabase): Promise<IAlertRow[]> {
  return db.getAllAsync(`
    SELECT 
      a.id,
      a.type,
      a.category,
      a.threshold,
      ROUND((IFNULL(SUM(t.amount), 0) / a.threshold) * 100, 1) AS progress
    FROM alerts a
    LEFT JOIN transactions t
      ON (
        (a.type = 'income' AND t.type = 'credit') OR
        (a.type = 'spending' AND t.type = 'debit')
      )
      AND (
        (a.frequency = 'weekly' 
          AND strftime('%W', t.date) = strftime('%W', 'now') 
          AND strftime('%Y', t.date) = strftime('%Y', 'now')
        )
        OR
        (a.frequency = 'monthly' 
          AND strftime('%m-%Y', t.date) = strftime('%m-%Y', 'now')
        )
      )
    GROUP BY a.id
    ORDER BY a.type, progress DESC;
  `);
}

export async function getUnreadNotifications(
  db: SQLiteDatabase,
  limit: number = 3
): Promise<INotificationRow[]> {
  return db.getAllAsync(
    `
    SELECT *
    FROM notifications
    WHERE is_read = 0
    ORDER BY created_at DESC
    LIMIT ?;
  `,
    [limit]
  );
}

export async function markNotificationAsUnread(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE notifications SET is_read = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
    [id]
  );
}
