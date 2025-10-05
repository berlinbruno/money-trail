// lib/db/alerts.ts
import { IAlertRow, INotificationRow } from '@/types/Common';
import { getCurrencySymbol } from '@/utils/finance/currencyUtils';
import { formatAmountWithSymbol } from '@/utils/formatterUtils';
import { SQLiteDatabase } from 'expo-sqlite';

export async function insertAlertNotifications(
  db: SQLiteDatabase,
  alerts: IAlertRow[]
): Promise<void> {
  if (!alerts?.length) return;

  const currencySymbol = await getCurrencySymbol();

  // Get existing notifications for today to avoid duplicates
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const existingNotifications = await db.getAllAsync(
    `SELECT message FROM notifications 
     WHERE type = 'alert' 
     AND date(created_at) = date(?);`,
    [today]
  );

  const existingMessages = new Set(existingNotifications.map((n: any) => n.message));

  // Process alerts without explicit transaction wrapper to avoid conflicts
  // Individual runAsync calls are atomic enough for this use case
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

    // Skip if this exact message was already created today
    if (existingMessages.has(message)) {
      continue;
    }

    try {
      await db.runAsync(
        `INSERT INTO notifications (type, title, message, severity, is_read)
         VALUES (?, ?, ?, ?, 0);`,
        ['alert', alert.type === 'income' ? 'Income Alert' : 'Spending Alert', message, severity]
      );

      // Add to our set to prevent duplicates within this batch
      existingMessages.add(message);
    } catch (error) {
      // Log individual insert errors but continue processing other alerts
      console.warn('Failed to insert notification for alert:', alert.id, error);
    }
  }

  // Cleanup old notifications to prevent database bloat (keep last 50)
  try {
    await cleanupOldNotifications(db, 50);
  } catch (error) {
    console.warn('Failed to cleanup old notifications:', error);
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
          AND date >= date('now', '-' || ((strftime('%w', 'now') + 6) % 7) || ' days') 
          AND date <= date('now', '+' || (6 - ((strftime('%w', 'now') + 6) % 7)) || ' days')
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
