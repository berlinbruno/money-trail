import * as BackgroundTask from 'expo-background-task';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { getConfig, setConfig } from './db/configQueries';
import { getFinanceInboxMessagesByDateRange, insertSmsBatch } from './smsSync';

export const BACKGROUND_TASK_IDENTIFIER = 'fetch-sms-task';
export const BACKGROUND_TASK_OPTIONS = {
  minimumInterval: 10, // in minutes
  stopOnTerminate: false,
  startOnBoot: true,
};

// Task scheduling configuration defaults
export const DEFAULT_TASK_CONFIG = {
  enabled: true,
  intervalMinutes: BACKGROUND_TASK_OPTIONS.minimumInterval,
  requiresWifi: false,
  runOnAppLaunch: true,
};

/**
 * Get task configuration from database or return defaults
 */
export const getTaskConfig = async (db: any) => {
  try {
    const configStr = await getConfig(db, 'taskConfig');
    if (configStr) {
      return { ...DEFAULT_TASK_CONFIG, ...JSON.parse(configStr) };
    }
  } catch (error) {
    console.error('Error retrieving task config:', error);
  }
  return DEFAULT_TASK_CONFIG;
};

/**
 * Save task configuration to database
 */
export const saveTaskConfig = async (db: any, config: typeof DEFAULT_TASK_CONFIG) => {
  try {
    await setConfig(db, 'taskConfig', JSON.stringify({ ...DEFAULT_TASK_CONFIG, ...config }));
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
 * Execute the SMS processing task
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
    // Get last sync time from config
    const lastSyncStr = await getConfig(db, 'lastSmsSync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    // Fetch new messages since last sync
    const inbox = await getFinanceInboxMessagesByDateRange(
      lastSync ? lastSync.getTime() : undefined,
      now.getTime(),
      200
    );

    // Log the total number of messages found
    executionLog.messageCount = inbox.length;

    if (inbox.length === 0) {
      executionLog.status = 'Completed';
      executionLog.details = 'No new messages found';
      const endTime = Date.now();
      executionLog.executionTimeMs = endTime - startTime;
      return executionLog;
    }

    // Process messages and insert into database
    const inserted = await insertSmsBatch(db, inbox, 'default', 1, 'sms');

    // Update last sync time if messages were processed
    if (inserted.length > 0) {
      await setConfig(db, 'lastSmsSync', now.toISOString());

      // Calculate performance metrics
      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;
      const processingRate = inserted.length > 0 ? inserted.length / (executionTimeMs / 1000) : 0;

      // Log execution in config table
      const executionKey = `task_execution_${Date.now()}`;
      executionLog.status = 'Completed';
      executionLog.details = `Processed ${inserted.length} new SMS messages`;
      executionLog.executionTimeMs = executionTimeMs;
      executionLog.processingRate = processingRate;

      await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
        executionKey,
        JSON.stringify(executionLog),
      ]);
    } else {
      executionLog.status = 'Completed';
      executionLog.details = 'No new transactions found in messages';
      const endTime = Date.now();
      executionLog.executionTimeMs = endTime - startTime;
    }

    // For debugging - log the first message if available
    if (inbox.length > 0) {
      console.log('Sample message processed:', inbox[0].body.substring(0, 50) + '...');
    }

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
 * Define and register the background task
 * @param innerAppMountedPromise Promise that resolves when the app is mounted
 */
export const initializeBackgroundTask = async (innerAppMountedPromise: Promise<void>) => {
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

  // Check if task is already registered before attempting to register again
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);

  if (!isRegistered) {
    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, BACKGROUND_TASK_OPTIONS);
      console.log(
        `Background SMS task registered successfully with interval: ${BACKGROUND_TASK_OPTIONS.minimumInterval} minutes`
      );
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  } else {
    console.log(`Background SMS task already registered`);
  }
};
