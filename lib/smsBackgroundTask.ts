import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { getMessageScanCount } from './db/settingsQueries';
import { syncTransactions } from './smsSync';

export const BACKGROUND_TASK_IDENTIFIER = 'fetch-sms-task';
export const BACKGROUND_TASK_OPTIONS = {
  minimumInterval: 10, // in minutes
  stopOnTerminate: false,
  startOnBoot: true,
};

// Task scheduling configuration defaults
export const DEFAULT_TASK_CONFIG = {
  enabled: true,
  intervalMinutes: 120, // Default 2 hours (matches settings default)
  messageScanCount: 200, // Default 200 messages (matches settings default)
  requiresWifi: false,
  runOnAppLaunch: true,
};

// Task configuration storage key
const TASK_CONFIG_KEY = '@money_trail_settings:taskConfig';

/**
 * Get task configuration from AsyncStorage or return defaults
 */
export const getTaskConfig = async () => {
  try {
    const configStr = await AsyncStorage.getItem(TASK_CONFIG_KEY);
    if (configStr) {
      return { ...DEFAULT_TASK_CONFIG, ...JSON.parse(configStr) };
    }
  } catch (error) {
    console.error('Error retrieving task config:', error);
  }
  return DEFAULT_TASK_CONFIG;
};

/**
 * Save task configuration to AsyncStorage
 */
export const saveTaskConfig = async (config: typeof DEFAULT_TASK_CONFIG) => {
  try {
    await AsyncStorage.setItem(
      TASK_CONFIG_KEY,
      JSON.stringify({ ...DEFAULT_TASK_CONFIG, ...config })
    );
    return true;
  } catch (error) {
    console.error('Error saving task config:', error);
    return false;
  }
};

export type FinanceSms = {
  _id: string;
  address: string;
  body: string;
  date: number;
  timestamp?: number; // extra field for history
  sms_hash?: string; // hash used for transaction matching
};

export type TaskExecutionLog = {
  timestamp: string;
  status: string;
  details?: string;
  messageCount?: number;
  error?: string;
  executionTimeMs?: number; // Track execution time in milliseconds
  processingRate?: number; // Messages processed per second
};

/**
 * Execute the SMS processing task with enhanced error handling
 * @param db The SQLite database instance
 * @returns Promise<TaskExecutionLog> Execution results
 */
export const executeTask = async (db: any): Promise<TaskExecutionLog> => {
  console.log('SMS processing task executing...');
  const startTime = Date.now();
  const now = new Date();
  const executionLog: TaskExecutionLog = {
    timestamp: now.toISOString(),
    status: 'Started',
  };

  try {
    // Get task configuration
    const config = await getTaskConfig();
    if (!config.enabled) {
      executionLog.status = 'Skipped';
      executionLog.details = 'Background sync is disabled';
      executionLog.executionTimeMs = Date.now() - startTime;
      return executionLog;
    }

    // Get the current messageScanCount from user settings
    const messageScanCount = await getMessageScanCount();

    // Use the enhanced sync function
    const result = await syncTransactions(db, {
      maxMessages: messageScanCount,
      defaultAccount: 'default',
      requireApproval: true,
    });

    // Update execution log with sync results
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

    // Log execution in config table for debugging
    const executionKey = `task_execution_${Date.now()}`;
    await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
      executionKey,
      JSON.stringify(executionLog),
    ]);

    return executionLog;
  } catch (error) {
    console.error('Error in SMS processing task:', error);
    const endTime = Date.now();
    executionLog.status = 'Failed';
    executionLog.error = error instanceof Error ? error.message : String(error);
    executionLog.details = 'Task execution failed, see error details';
    executionLog.executionTimeMs = endTime - startTime;

    // Log error in config table
    try {
      const errorKey = `task_execution_error_${Date.now()}`;
      await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
        errorKey,
        JSON.stringify(executionLog),
      ]);
    } catch (dbError) {
      console.error('Failed to log task error:', dbError);
    }

    return executionLog;
  }
};

/**
 * Register background task with current settings
 */
export const registerBackgroundTask = async (db: any): Promise<boolean> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);

    if (isRegistered) {
      console.log('Background SMS task already registered');
      return true;
    }

    // Get current configuration
    const config = await getTaskConfig();

    // Update background task options based on config
    const taskOptions = {
      ...BACKGROUND_TASK_OPTIONS,
      minimumInterval: config.intervalMinutes || BACKGROUND_TASK_OPTIONS.minimumInterval,
    };

    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, taskOptions);
    console.log(
      `Background SMS task registered with interval: ${taskOptions.minimumInterval} minutes`
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
      await TaskManager.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
      console.log('Background SMS task unregistered');
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
  db: any,
  newConfig: Partial<typeof DEFAULT_TASK_CONFIG>
): Promise<boolean> => {
  try {
    // Get current config
    const currentConfig = await getTaskConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };

    // Save updated config
    const saved = await saveTaskConfig(updatedConfig);
    if (!saved) {
      console.error('Failed to save task configuration');
      return false;
    }

    // If background sync is disabled, unregister the task
    if (!updatedConfig.enabled) {
      console.log('Background sync disabled, unregistering task');
      return await unregisterBackgroundTask();
    }

    // Check if task is currently registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);

    // If the interval has changed or task is not registered, we need to re-register
    const intervalChanged = currentConfig.intervalMinutes !== updatedConfig.intervalMinutes;

    if (isRegistered && intervalChanged) {
      console.log('Task interval changed, re-registering background task');
      // Unregister first, then re-register with new settings
      await unregisterBackgroundTask();
    }

    // Register with new settings if not registered or if we just unregistered
    if (!isRegistered || intervalChanged) {
      return await registerBackgroundTask(db);
    }

    console.log('Background task configuration updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update task configuration:', error);
    return false;
  }
};

/**
 * Get task execution history for debugging
 */
export const getTaskExecutionHistory = async (db: any, limit = 10): Promise<TaskExecutionLog[]> => {
  try {
    const result = await db.getAllAsync(
      'SELECT key, value FROM config WHERE key LIKE ? ORDER BY key DESC LIMIT ?',
      ['task_execution_%', limit]
    );

    return result
      .map((row: any) => {
        try {
          return JSON.parse(row.value) as TaskExecutionLog;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to get task execution history:', error);
    return [];
  }
};
/**
 * Define and register the background task with enhanced integration
 * @param innerAppMountedPromise Promise that resolves when the app is mounted
 */
export const initializeBackgroundTask = async (
  innerAppMountedPromise: Promise<void>
): Promise<void> => {
  // Define the task handler
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log('Background SMS task started');

    // Wait for app to be fully mounted
    await innerAppMountedPromise;

    try {
      // Open the database directly since we're in a background task
      const db = await openDatabaseAsync('app.db');

      // Execute the task
      const result = await executeTask(db);
      console.log(`Background task execution ${result.status}: ${result.details || ''}`);

      // Close the database when done
      await db.closeAsync();
    } catch (error) {
      console.error('Unhandled error in background task:', error);
    }

    console.log('Background SMS task completed');
    return BackgroundTask.BackgroundTaskResult.Success;
  });

  // Note: Task registration will be handled by the settings context
  // when background sync is enabled by the user
  console.log('Background SMS task handler defined');
};
