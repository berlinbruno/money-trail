import { refreshSettingsGlobally } from '@/utils/settingsUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { logError, logInfo } from '../database/loggingQueries';
import { syncTransactions } from './sync';

export const BACKGROUND_TASK_IDENTIFIER = 'fetch-sms-task';
export const MINIMUM_INTERVAL = 120; // 2 hours in minutes
export const TASK_CONFIG_KEY = '@sms_task_config';

// Task scheduling configuration defaults
export const DEFAULT_TASK_CONFIG = {
  enabled: true,
  intervalMinutes: 120, // Default 2 hours
  messageScanCount: 200, // Default 200 messages
  runOnAppLaunch: true,
};

/**
 * Get task configuration from AsyncStorage or return defaults
 */
export const getTaskConfig = async (): Promise<typeof DEFAULT_TASK_CONFIG> => {
  try {
    // Check SMS permission first
    const { hasSMSPermission } = await import('@/utils/permissionUtils');
    const smsAccess = await hasSMSPermission();

    const configJson = await AsyncStorage.getItem(TASK_CONFIG_KEY);
    const storedConfig = configJson ? JSON.parse(configJson) : {};

    return {
      enabled: (storedConfig.enabled ?? DEFAULT_TASK_CONFIG.enabled) && smsAccess,
      intervalMinutes: storedConfig.intervalMinutes ?? DEFAULT_TASK_CONFIG.intervalMinutes,
      messageScanCount: storedConfig.messageScanCount ?? DEFAULT_TASK_CONFIG.messageScanCount,
      runOnAppLaunch:
        (storedConfig.runOnAppLaunch ?? DEFAULT_TASK_CONFIG.runOnAppLaunch) && smsAccess,
    };
  } catch (error) {
    console.error('Error retrieving task configuration:', error);
    return { ...DEFAULT_TASK_CONFIG, enabled: false, runOnAppLaunch: false };
  }
};

/**
 * Save task configuration to AsyncStorage
 */
export const saveTaskConfig = async (config: typeof DEFAULT_TASK_CONFIG): Promise<boolean> => {
  try {
    // Validate configuration values
    if (config.intervalMinutes < 15) {
      console.warn('Interval too small, using minimum of 15 minutes');
      config.intervalMinutes = 15;
    }
    if (config.messageScanCount < 1 || config.messageScanCount > 1000) {
      console.warn('Invalid message scan count, using default');
      config.messageScanCount = DEFAULT_TASK_CONFIG.messageScanCount;
    }

    const finalConfig = { ...DEFAULT_TASK_CONFIG, ...config };
    await AsyncStorage.setItem(TASK_CONFIG_KEY, JSON.stringify(finalConfig));
    return true;
  } catch (error) {
    console.error('Error saving task configuration:', error);
    return false;
  }
};

export type TaskExecutionLog = {
  timestamp: string;
  status: string;
  details?: string;
  messageCount?: number;
  error?: string;
  executionTimeMs?: number;
  processingRate?: number;
};

/**
 * Execute the SMS processing task
 * @param db The SQLite database instance (optional - will open if not provided)
 * @returns Promise<TaskExecutionLog> Execution results
 */
export const executeTask = async (db?: any): Promise<TaskExecutionLog> => {
  console.log('SMS processing task executing...');
  const startTime = Date.now();
  const executionLog: TaskExecutionLog = {
    timestamp: new Date().toISOString(),
    status: 'Started',
  };

  let shouldCloseDb = false;
  let taskDb = db;

  try {
    // Get task configuration
    const config = await getTaskConfig();
    if (!config.enabled) {
      executionLog.status = 'Skipped';
      executionLog.details = 'Background sync is disabled';
      executionLog.executionTimeMs = Date.now() - startTime;
      return executionLog;
    }

    // Open database if not provided
    if (!taskDb) {
      taskDb = await openDatabaseAsync('app.db');
      await taskDb.execAsync('PRAGMA journal_mode = WAL;');
      await taskDb.execAsync('PRAGMA busy_timeout = 30000;');
      shouldCloseDb = true;
    }

    // Execute SMS sync
    const result = await syncTransactions(taskDb, {
      maxMessages: config.messageScanCount,
      defaultAccount: 'default',
      forceApproval: 1,
      onSyncComplete: () => {
        // Refresh settings when background sync completes
        refreshSettingsGlobally().catch(console.error);
      },
    });

    // Update execution log
    executionLog.messageCount = result.processed;
    executionLog.status = result.success ? 'Completed' : 'Failed';
    executionLog.details = result.success
      ? `Processed ${result.processed} messages, inserted ${result.inserted} transactions`
      : `Sync failed: ${result.errorMessages.join(', ')}`;
    executionLog.executionTimeMs = result.executionTime;
    executionLog.processingRate =
      result.processed > 0 ? result.processed / (result.executionTime / 1000) : 0;

    if (!result.success) {
      executionLog.error = result.errorMessages.join(', ');
    }

    // Log to database
    try {
      if (result.success) {
        await logInfo(
          taskDb,
          'task_execution',
          'Background SMS sync completed',
          executionLog.details || '',
          {
            task_type: 'background_sync',
            messages_processed: result.processed,
            transactions_inserted: result.inserted,
            execution_time_ms: executionLog.executionTimeMs,
            processing_rate: executionLog.processingRate,
            success_rate:
              result.processed > 0 ? ((result.inserted / result.processed) * 100).toFixed(2) : 0,
          }
        );
      } else {
        await logError(
          taskDb,
          'task_execution',
          'Background SMS sync failed',
          executionLog.error || 'Unknown error',
          {
            task_type: 'background_sync',
            messages_processed: result.processed,
            execution_time_ms: executionLog.executionTimeMs,
            error_messages: result.errorMessages,
          }
        );
      }
    } catch {
      // Silent fail - don't break sync for logging issues
    }

    return executionLog;
  } catch (error) {
    console.error('Error in SMS processing task:', error);
    executionLog.status = 'Failed';
    executionLog.error = error instanceof Error ? error.message : String(error);
    executionLog.details = 'Task execution failed';
    executionLog.executionTimeMs = Date.now() - startTime;

    // Log error to database
    try {
      if (taskDb) {
        await logError(
          taskDb,
          'task_execution',
          'Background SMS sync execution failed',
          executionLog.error,
          {
            task_type: 'background_sync',
            execution_time_ms: executionLog.executionTimeMs,
            error_type: error instanceof Error ? error.constructor.name : 'Unknown',
          }
        );
      }
    } catch {
      // Silent fail - don't break sync for logging issues
    }

    return executionLog;
  } finally {
    // Close database if we opened it
    if (shouldCloseDb && taskDb) {
      try {
        await taskDb.closeAsync();
      } catch {
        // Silent fail - database might already be closed
      }
    }
  }
};

/**
 * Register background task with current settings
 */
export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    if (isRegistered) {
      return true;
    }

    const config = await getTaskConfig();
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: config.intervalMinutes || MINIMUM_INTERVAL,
    });

    console.log(
      `Background SMS task registered (${config.intervalMinutes || MINIMUM_INTERVAL}min)`
    );
    return true;
  } catch (error) {
    console.error('Failed to register background task:', error);
    return false;
  }
};

/**
 * Unregister background task
 */
export const unregisterBackgroundTask = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
    }
    return true;
  } catch (error) {
    console.error('Failed to unregister background task:', error);
    return false;
  }
};

/**
 * Update task configuration and re-register if needed
 */
export const updateTaskConfiguration = async (
  newConfig: Partial<typeof DEFAULT_TASK_CONFIG>
): Promise<boolean> => {
  try {
    const currentConfig = await getTaskConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };

    if (!(await saveTaskConfig(updatedConfig))) {
      return false;
    }

    if (!updatedConfig.enabled) {
      return await unregisterBackgroundTask();
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    const intervalChanged = currentConfig.intervalMinutes !== updatedConfig.intervalMinutes;

    if (isRegistered && intervalChanged) {
      await unregisterBackgroundTask();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!isRegistered || intervalChanged) {
      return await registerBackgroundTask();
    }

    return true;
  } catch (error) {
    console.error('Failed to update task configuration:', error);
    return false;
  }
};

/**
 * Get current task registration status and configuration
 */
export const getTaskStatus = async (): Promise<{
  isRegistered: boolean;
  config: typeof DEFAULT_TASK_CONFIG;
  registeredTasks: any[];
}> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    const config = await getTaskConfig();
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();

    return {
      isRegistered,
      config,
      registeredTasks: registeredTasks.filter(
        (task) => task.taskName === BACKGROUND_TASK_IDENTIFIER
      ),
    };
  } catch (error) {
    console.error('Failed to get task status:', error);
    return {
      isRegistered: false,
      config: DEFAULT_TASK_CONFIG,
      registeredTasks: [],
    };
  }
};

/**
 * Clear SMS sync logs (removes task_execution category logs)
 */
export const clearSyncHistory = async (db: any): Promise<boolean> => {
  try {
    await db.execAsync(
      `DELETE FROM app_logs WHERE category = 'task_execution' AND metadata LIKE '%"task_type":"background_sync"%'`
    );
    return true;
  } catch (error) {
    console.error('Error clearing sync history:', error);
    return false;
  }
};

/**
 * Get SMS sync history from database logs
 */
export const getSyncHistory = async (db: any, limit = 50): Promise<any[]> => {
  try {
    const logs = await db.getAllAsync(
      `SELECT * FROM app_logs 
       WHERE category = 'task_execution' 
       AND metadata LIKE '%"task_type":"background_sync"%'
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit]
    );

    return logs.map((log: any) => {
      let metadata = {};
      try {
        metadata = log.metadata ? JSON.parse(log.metadata) : {};
      } catch {
        metadata = {};
      }

      return {
        ...log,
        metadata,
      };
    });
  } catch (error) {
    console.error('Error getting sync history:', error);
    return [];
  }
};

/**
 * Get sync statistics from database logs
 */
export const getSyncStatistics = async (
  db: any
): Promise<{
  totalSyncs: number;
  successRate: number;
  avgExecutionTime: number;
  totalMessagesProcessed: number;
  totalTransactionsInserted: number;
  lastSyncTime: string | null;
} | null> => {
  try {
    const logs = await getSyncHistory(db, 100); // Get more logs for better statistics
    if (logs.length === 0) {
      return null;
    }

    const completedSyncs = logs.filter((log) => log.log_level === 'info');
    const totalExecutionTime = logs.reduce((sum, log) => {
      const execTime = log.metadata?.execution_time_ms || 0;
      return sum + execTime;
    }, 0);

    const totalMessagesProcessed = logs.reduce((sum, log) => {
      const messages = log.metadata?.messages_processed || 0;
      return sum + messages;
    }, 0);

    const totalTransactionsInserted = logs.reduce((sum, log) => {
      const transactions = log.metadata?.transactions_inserted || 0;
      return sum + transactions;
    }, 0);

    return {
      totalSyncs: logs.length,
      successRate: logs.length > 0 ? (completedSyncs.length / logs.length) * 100 : 0,
      avgExecutionTime: logs.length > 0 ? totalExecutionTime / logs.length : 0,
      totalMessagesProcessed,
      totalTransactionsInserted,
      lastSyncTime: logs[0]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error calculating sync statistics:', error);
    return null;
  }
};
/**
 * Initialize the background task
 */
export const initializeBackgroundTask = async (
  innerAppMountedPromise: Promise<void>
): Promise<void> => {
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    await innerAppMountedPromise;
    try {
      const result = await executeTask();
      console.log(`Background task: ${result.status}`);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('Background task error:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });

  const config = await getTaskConfig();
  if (config.enabled && !(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER))) {
    await registerBackgroundTask();
  }
};
