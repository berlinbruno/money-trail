import { type ID, type Timestamp } from '@/types/Common';
import { type SQLiteDatabase } from 'expo-sqlite';

// Log categories for different parts of the application
export type LogCategory =
  | 'task_execution'
  | 'sms_processing'
  | 'transaction'
  | 'database'
  | 'auth'
  | 'notification'
  | 'system'
  | 'error'
  | 'debug';

// Log levels following standard logging practices
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface AppLog {
  id: ID;
  log_key: string;
  category: LogCategory;
  log_level: LogLevel;
  status: string;
  timestamp: Timestamp;
  message?: string;
  details?: string;
  metadata?: string;
  created_at: Timestamp;
}

export interface LogEntry {
  log_key: string;
  category: LogCategory;
  log_level: LogLevel;
  status: string;
  message: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * Create a generic log entry
 */
export async function createLog(db: SQLiteDatabase, entry: LogEntry): Promise<void> {
  const timestamp = entry.timestamp || new Date().toISOString();
  const metadata = entry.metadata ? JSON.stringify(entry.metadata) : null;

  await db.runAsync(
    `
    INSERT INTO app_logs (
      log_key,
      category,
      log_level,
      status,
      timestamp,
      message,
      details,
      metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      entry.log_key,
      entry.category,
      entry.log_level,
      entry.status,
      timestamp,
      entry.message,
      entry.details || null,
      metadata,
    ]
  );
}

/**
 * Log information level message
 */
export async function logInfo(
  db: SQLiteDatabase,
  category: LogCategory,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createLog(db, {
    log_key: `${category}_${Date.now()}`,
    category,
    log_level: 'info',
    status: 'info',
    message,
    details,
    metadata,
  });
}

/**
 * Log warning level message
 */
export async function logWarning(
  db: SQLiteDatabase,
  category: LogCategory,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createLog(db, {
    log_key: `${category}_warning_${Date.now()}`,
    category,
    log_level: 'warn',
    status: 'warning',
    message,
    details,
    metadata,
  });
}

/**
 * Log error level message
 */
export async function logError(
  db: SQLiteDatabase,
  category: LogCategory,
  message: string,
  error?: Error | string,
  metadata?: Record<string, any>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  await createLog(db, {
    log_key: `${category}_error_${Date.now()}`,
    category,
    log_level: 'error',
    status: 'error',
    message,
    details: errorMessage,
    metadata: {
      ...metadata,
      ...(errorStack && { stack: errorStack }),
    },
  });
}

/**
 * Log debug level message
 */
export async function logDebug(
  db: SQLiteDatabase,
  category: LogCategory,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createLog(db, {
    log_key: `${category}_debug_${Date.now()}`,
    category,
    log_level: 'debug',
    status: 'debug',
    message,
    details,
    metadata,
  });
}

/**
 * Log critical level message
 */
export async function logCritical(
  db: SQLiteDatabase,
  category: LogCategory,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createLog(db, {
    log_key: `${category}_critical_${Date.now()}`,
    category,
    log_level: 'critical',
    status: 'critical',
    message,
    details,
    metadata,
  });
}

/**
 * Get logs by category
 */
export async function getLogsByCategory(
  db: SQLiteDatabase,
  category: LogCategory,
  limit = 50
): Promise<AppLog[]> {
  const result = await db.getAllAsync(
    `
    SELECT *
    FROM app_logs
    WHERE category = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [category, limit]
  );

  return result as AppLog[];
}

/**
 * Get logs by level
 */
export async function getLogsByLevel(
  db: SQLiteDatabase,
  level: LogLevel,
  limit = 50
): Promise<AppLog[]> {
  const result = await db.getAllAsync(
    `
    SELECT *
    FROM app_logs
    WHERE log_level = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [level, limit]
  );

  return result as AppLog[];
}

/**
 * Get logs by category and level
 */
export async function getLogsByCategoryAndLevel(
  db: SQLiteDatabase,
  category: LogCategory,
  level: LogLevel,
  limit = 50
): Promise<AppLog[]> {
  const result = await db.getAllAsync(
    `
    SELECT *
    FROM app_logs
    WHERE category = ? AND log_level = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [category, level, limit]
  );

  return result as AppLog[];
}

/**
 * Get all logs ordered by timestamp (most recent first)
 */
export async function getAllLogs(db: SQLiteDatabase, limit = 100): Promise<AppLog[]> {
  const result = await db.getAllAsync(
    `
    SELECT *
    FROM app_logs
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [limit]
  );

  return result as AppLog[];
}

/**
 * Get recent logs (last 20 entries)
 */
export async function getRecentLogs(db: SQLiteDatabase): Promise<AppLog[]> {
  return getAllLogs(db, 20);
}

/**
 * Clear old logs (keep only last specified number of entries)
 */
export async function clearOldLogs(db: SQLiteDatabase, keepCount = 100): Promise<void> {
  await db.runAsync(
    `
    DELETE FROM app_logs
    WHERE id NOT IN (
      SELECT id FROM app_logs
      ORDER BY created_at DESC
      LIMIT ?
    )
  `,
    [keepCount]
  );
}

/**
 * Clear logs by category
 */
export async function clearLogsByCategory(
  db: SQLiteDatabase,
  category: LogCategory
): Promise<void> {
  await db.runAsync(`DELETE FROM app_logs WHERE category = ?`, [category]);
}

/**
 * Clear all logs
 */
export async function clearAllLogs(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(`DELETE FROM app_logs`);
}

/**
 * Get log statistics by category
 */
export async function getLogStatsByCategory(db: SQLiteDatabase): Promise<
  {
    category: LogCategory;
    total_count: number;
    error_count: number;
    warning_count: number;
    info_count: number;
  }[]
> {
  const result = await db.getAllAsync(`
    SELECT
      category,
      COUNT(*) as total_count,
      SUM(CASE WHEN log_level = 'error' THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN log_level = 'warn' THEN 1 ELSE 0 END) as warning_count,
      SUM(CASE WHEN log_level = 'info' THEN 1 ELSE 0 END) as info_count
    FROM app_logs
    GROUP BY category
    ORDER BY total_count DESC
  `);

  return result as {
    category: LogCategory;
    total_count: number;
    error_count: number;
    warning_count: number;
    info_count: number;
  }[];
}

// Backward compatibility functions for task execution logging
export interface TaskExecutionMetrics {
  execution_key: string;
  status: 'success' | 'error';
  message_count: number;
  execution_time_ms: number;
  processing_rate: number;
  timestamp: string;
}

export interface TaskExecutionError {
  execution_key: string;
  error_message: string;
  timestamp: string;
}

/**
 * Log a successful background task execution (backward compatibility)
 */
export async function logTaskExecution(
  db: SQLiteDatabase,
  metrics: TaskExecutionMetrics
): Promise<void> {
  await createLog(db, {
    log_key: metrics.execution_key,
    category: 'task_execution',
    log_level: 'info',
    status: metrics.status,
    message: `Task executed: ${metrics.status}`,
    details: `Processed ${metrics.message_count} messages in ${metrics.execution_time_ms}ms`,
    metadata: {
      message_count: metrics.message_count,
      execution_time_ms: metrics.execution_time_ms,
      processing_rate: metrics.processing_rate,
    },
    timestamp: metrics.timestamp,
  });
}

/**
 * Log a background task error (backward compatibility)
 */
export async function logTaskError(db: SQLiteDatabase, error: TaskExecutionError): Promise<void> {
  await createLog(db, {
    log_key: error.execution_key,
    category: 'task_execution',
    log_level: 'error',
    status: 'error',
    message: 'Task execution failed',
    details: error.error_message,
    timestamp: error.timestamp,
  });
}

/**
 * Get recent task execution logs (backward compatibility)
 */
export async function getRecentTaskExecutionLogs(db: SQLiteDatabase): Promise<AppLog[]> {
  return getLogsByCategory(db, 'task_execution', 20);
}

/**
 * Clear old task execution logs (backward compatibility)
 */
export async function clearOldTaskExecutionLogs(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `
    DELETE FROM app_logs
    WHERE category = 'task_execution'
    AND id NOT IN (
      SELECT id FROM app_logs
      WHERE category = 'task_execution'
      ORDER BY created_at DESC
      LIMIT 50
    )
  `
  );
}

/**
 * Clear all task execution logs (backward compatibility)
 */
export async function clearAllTaskExecutionLogs(db: SQLiteDatabase): Promise<void> {
  await clearLogsByCategory(db, 'task_execution');
}
