import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { BACKGROUND_TASK_IDENTIFIER, BACKGROUND_TASK_OPTIONS } from './sms/backgroundTask';

/**
 * Initialize and verify background task registration
 * Ensures the SMS background task is properly registered at app startup
 */
export async function initializeBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    if (!isRegistered) {
      console.log('Background task not registered, registering now...');
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, BACKGROUND_TASK_OPTIONS);
      console.log('Background task registered successfully');
    } else {
      console.log('Background task already registered');
    }
  } catch (error) {
    console.error('Error checking/registering background task:', error);
    // Don't throw - allow app to continue without background task
  }
}
