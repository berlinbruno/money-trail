import { getSettingsValue, setSettingsValue } from '@/utils/asyncStorageHelpers';
import * as BackgroundTask from 'expo-background-task';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { logError, logInfo, logWarning } from '../database/loggingQueries';
import { getMessageScanCount } from '../database/settingsQueries';
import { syncTransactions } from './sync';

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
  runOnAppLaunch: true,
};

// Task configuration storage keys - reuse existing settings where possible
const TASK_CONFIG_KEYS = {
  enabled: 'back_sync', // Reuse existing back_sync setting
  intervalMinutes: 'sync_interval', // Reuse existing sync_interval setting
  messageScanCount: 'message_scan_count', // Reuse existing message_scan_count setting
  runOnAppLaunch: 'fetch_on_launch', // Reuse existing fetch_on_launch setting
};

/**
 * Get task configuration from settings or return defaults
 */
export async function getTaskConfig(): Promise<typeof DEFAULT_TASK_CONFIG> {
  try {
    // Get individual task config values using the settings helpers
    const enabled = await getSettingsValue(TASK_CONFIG_KEYS.enabled);
    const intervalMinutes = await getSettingsValue(TASK_CONFIG_KEYS.intervalMinutes);
    const messageScanCount = await getSettingsValue(TASK_CONFIG_KEYS.messageScanCount);
    const runOnAppLaunch = await getSettingsValue(TASK_CONFIG_KEYS.runOnAppLaunch);

    return {
      enabled: enabled ? enabled === 'true' : DEFAULT_TASK_CONFIG.enabled,
      intervalMinutes: intervalMinutes
        ? parseInt(intervalMinutes, 10)
        : DEFAULT_TASK_CONFIG.intervalMinutes,
      messageScanCount: messageScanCount
        ? parseInt(messageScanCount, 10)
        : DEFAULT_TASK_CONFIG.messageScanCount,
      runOnAppLaunch: runOnAppLaunch
        ? runOnAppLaunch === 'true'
        : DEFAULT_TASK_CONFIG.runOnAppLaunch,
    };
  } catch (error) {
    console.error('Error retrieving task configuration:', error);
    return DEFAULT_TASK_CONFIG;
  }
}

/**
 * Save task configuration to settings
 */
export const saveTaskConfig = async (config: typeof DEFAULT_TASK_CONFIG) => {
  try {
    const finalConfig = { ...DEFAULT_TASK_CONFIG, ...config };

    await Promise.all([
      setSettingsValue(TASK_CONFIG_KEYS.enabled, finalConfig.enabled.toString()),
      setSettingsValue(TASK_CONFIG_KEYS.intervalMinutes, finalConfig.intervalMinutes.toString()),
      setSettingsValue(TASK_CONFIG_KEYS.messageScanCount, finalConfig.messageScanCount.toString()),
      setSettingsValue(TASK_CONFIG_KEYS.runOnAppLaunch, finalConfig.runOnAppLaunch.toString()),
    ]);

    return true;
  } catch (error) {
    console.error('Error saving task configuration:', error);
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
  const taskKey = `background_task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const executionLog: TaskExecutionLog = {
    timestamp: now.toISOString(),
    status: 'Started',
  };

  try {
    // Log task execution start
    await logInfo(
      db,
      'task_execution',
      'Background task started',
      'SMS processing background task execution started',
      {
        task_key: taskKey,
        start_time: now.toISOString(),
      }
    );

    // Get task configuration
    const config = await getTaskConfig();
    if (!config.enabled) {
      executionLog.status = 'Skipped';
      executionLog.details = 'Background sync is disabled';
      executionLog.executionTimeMs = Date.now() - startTime;

      await logWarning(
        db,
        'task_execution',
        'Background task skipped',
        'Background sync is disabled in settings',
        {
          task_key: taskKey,
          execution_time_ms: executionLog.executionTimeMs,
        }
      );

      return executionLog;
    }

    // Get the current messageScanCount from user settings
    const messageScanCount = await getMessageScanCount();

    await logInfo(
      db,
      'task_execution',
      'Background task configuration',
      `Task will process up to ${messageScanCount} messages`,
      {
        task_key: taskKey,
        message_scan_count: messageScanCount,
        config,
      }
    );

    // Use the enhanced sync function
    const result = await syncTransactions(db, {
      maxMessages: messageScanCount,
      defaultAccount: 'default',
      forceApproval: 1,
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

    // Log execution completion
    if (result.success) {
      await logInfo(
        db,
        'task_execution',
        'Background task completed successfully',
        executionLog.details || 'Task completed',
        {
          task_key: taskKey,
          ...result,
          processing_rate: executionLog.processingRate,
        }
      );
    } else {
      await logError(
        db,
        'task_execution',
        'Background task completed with errors',
        executionLog.error || 'Unknown error',
        {
          task_key: taskKey,
          ...result,
          error_messages: result.errorMessages,
        }
      );
    }

    return executionLog;
  } catch (error) {
    console.error('Error in SMS processing task:', error);
    const endTime = Date.now();
    executionLog.status = 'Failed';
    executionLog.error = error instanceof Error ? error.message : String(error);
    executionLog.details = 'Task execution failed, see error details';
    executionLog.executionTimeMs = endTime - startTime;

    // Log task execution error
    await logError(db, 'task_execution', 'Background task execution failed', executionLog.error, {
      task_key: taskKey,
      execution_time_ms: executionLog.executionTimeMs,
      error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      stack_trace: error instanceof Error ? error.stack : undefined,
    });

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

      // Log that task is already registered
      await logInfo(
        db,
        'task_execution',
        'Background task registration skipped',
        'Background task is already registered with the system',
        {
          task_identifier: BACKGROUND_TASK_IDENTIFIER,
          already_registered: true,
        }
      );

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

    // Log successful task registration
    await logInfo(
      db,
      'task_execution',
      'Background task registered',
      `Background task registered successfully with ${taskOptions.minimumInterval} minute interval`,
      {
        task_identifier: BACKGROUND_TASK_IDENTIFIER,
        interval_minutes: taskOptions.minimumInterval,
        stop_on_terminate: taskOptions.stopOnTerminate,
        start_on_boot: taskOptions.startOnBoot,
        configuration: config,
        task_options: taskOptions,
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to register background task:', error);

    // Log registration failure
    await logError(
      db,
      'task_execution',
      'Background task registration failed',
      error instanceof Error ? error.message : String(error),
      {
        task_identifier: BACKGROUND_TASK_IDENTIFIER,
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      }
    );

    return false;
  }
};

/**
 * Unregister background task
 */
export const unregisterBackgroundTask = async (db?: any): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);

    if (isRegistered) {
      // For BackgroundTask, we need to unregister using BackgroundTask API
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
      console.log('Background SMS task unregistered');

      // Log task unregistration if database is available
      if (db) {
        await logInfo(
          db,
          'task_execution',
          'Background task unregistered',
          'Background task has been unregistered from the system',
          {
            task_identifier: BACKGROUND_TASK_IDENTIFIER,
            unregistered_at: new Date().toISOString(),
          }
        );
      }
    } else {
      console.log('Background SMS task was not registered');

      // Log that task was not registered if database is available
      if (db) {
        await logInfo(
          db,
          'task_execution',
          'Background task unregistration skipped',
          'Background task was not registered, no action needed',
          {
            task_identifier: BACKGROUND_TASK_IDENTIFIER,
            was_registered: false,
          }
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to unregister background task:', error);

    // Log unregistration failure if database is available
    if (db) {
      await logError(
        db,
        'task_execution',
        'Background task unregistration failed',
        error instanceof Error ? error.message : String(error),
        {
          task_identifier: BACKGROUND_TASK_IDENTIFIER,
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        }
      );
    }

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

    // Log the configuration update attempt
    await logInfo(
      db,
      'task_execution',
      'Background task configuration update started',
      'Attempting to update background task configuration',
      {
        current_config: currentConfig,
        new_config: newConfig,
        updated_config: updatedConfig,
      }
    );

    // Save updated config
    const saved = await saveTaskConfig(updatedConfig);
    if (!saved) {
      console.error('Failed to save task configuration');
      await logError(
        db,
        'task_execution',
        'Background task configuration save failed',
        'Failed to save task configuration to storage',
        {
          updated_config: updatedConfig,
        }
      );
      return false;
    }

    // If background sync is disabled, unregister the task
    if (!updatedConfig.enabled) {
      console.log('Background sync disabled, unregistering task');
      await logInfo(
        db,
        'task_execution',
        'Background sync disabled',
        'Background sync disabled, unregistering task',
        {
          previous_enabled: currentConfig.enabled,
        }
      );
      return await unregisterBackgroundTask(db);
    }

    // Check if task is currently registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);

    // If the interval has changed or task is not registered, we need to re-register
    const intervalChanged = currentConfig.intervalMinutes !== updatedConfig.intervalMinutes;

    if (isRegistered && intervalChanged) {
      console.log(
        `Task interval changed from ${currentConfig.intervalMinutes} to ${updatedConfig.intervalMinutes} minutes, re-registering background task`
      );

      await logInfo(
        db,
        'task_execution',
        'Background task interval changed',
        `Task interval changed, forcing re-registration`,
        {
          old_interval: currentConfig.intervalMinutes,
          new_interval: updatedConfig.intervalMinutes,
          task_identifier: BACKGROUND_TASK_IDENTIFIER,
        }
      );

      // Unregister first, then re-register with new settings
      const unregistered = await unregisterBackgroundTask(db);
      if (!unregistered) {
        console.error('Failed to unregister task before re-registration');
        await logError(
          db,
          'task_execution',
          'Background task unregistration failed during update',
          'Failed to unregister task before applying new interval',
          {
            old_interval: currentConfig.intervalMinutes,
            new_interval: updatedConfig.intervalMinutes,
          }
        );
        return false;
      }

      // Small delay to ensure unregistration is complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Register with new settings if not registered or if we just unregistered
    if (!isRegistered || intervalChanged) {
      const registered = await registerBackgroundTask(db);

      if (registered) {
        await logInfo(
          db,
          'task_execution',
          'Background task configuration updated successfully',
          'Background task registered with new configuration',
          {
            updated_config: updatedConfig,
            was_registered: isRegistered,
            interval_changed: intervalChanged,
          }
        );
      } else {
        await logError(
          db,
          'task_execution',
          'Background task registration failed during update',
          'Failed to register task with new configuration',
          {
            updated_config: updatedConfig,
          }
        );
      }

      return registered;
    }

    console.log('Background task configuration updated successfully (no re-registration needed)');
    await logInfo(
      db,
      'task_execution',
      'Background task configuration updated (no re-registration)',
      'Configuration updated without requiring task re-registration',
      {
        updated_config: updatedConfig,
      }
    );
    return true;
  } catch (error) {
    console.error('Failed to update task configuration:', error);
    await logError(
      db,
      'task_execution',
      'Background task configuration update failed',
      error instanceof Error ? error.message : String(error),
      {
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        stack_trace: error instanceof Error ? error.stack : undefined,
      }
    );
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
 * Define and register the background task with enhanced integration
 * @param innerAppMountedPromise Promise that resolves when the app is mounted
 */
export const initializeBackgroundTask = async (
  innerAppMountedPromise: Promise<void>
): Promise<void> => {
  // Define the task handler
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log('Background SMS task started');
    let db: any = null;
    const taskStartTime = Date.now();
    const taskKey = `bg_task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      // Wait for app to be fully mounted
      await innerAppMountedPromise;

      // Open the database directly since we're in a background task
      db = await openDatabaseAsync('app.db');

      // Log background task initiation
      await logInfo(
        db,
        'task_execution',
        'Background task initiated',
        'Background SMS processing task started by system scheduler',
        {
          task_key: taskKey,
          task_identifier: BACKGROUND_TASK_IDENTIFIER,
          start_time: new Date().toISOString(),
          trigger: 'system_scheduler',
        }
      );

      // Execute the task
      const result = await executeTask(db);
      const executionTime = Date.now() - taskStartTime;

      console.log(`Background task execution ${result.status}: ${result.details || ''}`);

      // Log background task completion
      await logInfo(
        db,
        'task_execution',
        'Background task completed',
        `Task completed with status: ${result.status}`,
        {
          task_key: taskKey,
          task_identifier: BACKGROUND_TASK_IDENTIFIER,
          execution_status: result.status,
          execution_time_ms: executionTime,
          messages_processed: result.messageCount || 0,
          processing_rate: result.processingRate || 0,
          completion_time: new Date().toISOString(),
        }
      );

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('Unhandled error in background task:', error);
      const executionTime = Date.now() - taskStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log background task error if database is available
      if (db) {
        try {
          await logError(
            db,
            'task_execution',
            'Background task failed',
            `Background task execution failed: ${errorMessage}`,
            {
              task_key: taskKey,
              task_identifier: BACKGROUND_TASK_IDENTIFIER,
              execution_time_ms: executionTime,
              error_type: error instanceof Error ? error.constructor.name : 'Unknown',
              error_message: errorMessage,
              stack_trace: error instanceof Error ? error.stack : undefined,
              failure_time: new Date().toISOString(),
            }
          );
        } catch (logError) {
          console.error('Failed to log background task error:', logError);
        }
      }

      return BackgroundTask.BackgroundTaskResult.Failed;
    } finally {
      // Close the database when done
      if (db) {
        try {
          await db.closeAsync();
        } catch (closeError) {
          console.error('Failed to close database:', closeError);
        }
      }
      console.log('Background SMS task completed');
    }
  });

  // Note: Task registration will be handled by the settings context
  // when background sync is enabled by the user
  console.log('Background SMS task handler defined');
};
