// lib/db/alerts.ts
import { IAlertRow, INotificationRow } from '@/types/Common';
import { formatAmountWithSymbol } from '@/utils/formatters';
import { SQLiteDatabase } from 'expo-sqlite';
import { getCurrencyFormat } from './settingsQueries';

/**
 * Get currency symbol for notifications based on stored currency format
 */
async function getCurrencySymbol(db: SQLiteDatabase): Promise<string> {
  const currencyCode = await getCurrencyFormat(db);
  const currencyMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CNY: '¥',
  };
  return currencyMap[currencyCode] || '$';
}

export async function insertAlertNotifications(
  db: SQLiteDatabase,
  alerts: IAlertRow[]
): Promise<void> {
  if (!alerts?.length) return;

  const currencySymbol = await getCurrencySymbol(db);

  // Use transaction for better performance
  await db.withTransactionAsync(async () => {
    for (const alert of alerts) {
      if (alert.progress < 50) continue; // skip minor progress

      const cappedProgress = Math.min(alert.progress, 100);
      let message = '';
      let severity: INotificationRow['severity'] = 'medium';
      const formattedThreshold = formatAmountWithSymbol(alert.threshold, currencySymbol);

      if (alert.type === 'income') {
        if (cappedProgress >= 100) {
          message = `Goal Achieved: You've reached ${formattedThreshold} in income for "${alert.category}" (${cappedProgress}%).`;
          severity = 'success';
        } else if (cappedProgress >= 85) {
          message = `Great! You're at ${cappedProgress}% of your income goal ${formattedThreshold} for "${alert.category}".`;
          severity = 'medium';
        } else {
          message = `You're at ${cappedProgress}% of your ${formattedThreshold} income goal for "${alert.category}".`;
          severity = 'low';
        }
      } else {
        // spending alerts
        if (cappedProgress >= 100) {
          message = `Overspent: You've exceeded your ${formattedThreshold} limit for "${alert.category}" (${cappedProgress}%).`;
          severity = 'critical';
        } else if (cappedProgress >= 85) {
          message = `Warning: You're at ${cappedProgress}% of your ${formattedThreshold} spending limit for "${alert.category}".`;
          severity = 'high';
        } else {
          message = `You've used ${cappedProgress}% of your ${formattedThreshold} spending limit for "${alert.category}".`;
          severity = 'medium';
        }
      }

      await db.runAsync(
        `INSERT INTO notifications (type, title, message, severity, is_read)
         VALUES (?, ?, ?, ?, 0);`,
        ['alert', alert.type === 'income' ? 'Income Alert' : 'Spending Alert', message, severity]
      );
    }
  });
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

export async function markNotificationAsRead(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
    [id]
  );
}

export async function markNotificationAsUnread(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE notifications SET is_read = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
    [id]
  );
}

export async function clearAllNotifications(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(`UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP;`);
}

export async function deleteAllNotifications(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(`DELETE FROM notifications;`);
}

export async function cleanupOldNotifications(
  db: SQLiteDatabase,
  keepCount: number = 20
): Promise<void> {
  // Keep only the most recent notifications (both read and unread)
  await db.runAsync(
    `DELETE FROM notifications 
     WHERE id NOT IN (
       SELECT id FROM notifications 
       ORDER BY created_at DESC 
       LIMIT ?
     );`,
    [keepCount]
  );
}
