import * as BackgroundTask from 'expo-background-task';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { getConfig, setConfig } from './db/configQueries';
import {
  getFinanceInboxMessages,
  getFinanceInboxMessagesByDateRange,
  insertSmsBatch,
} from './smsSync';

const BACKGROUND_TASK_IDENTIFIER = 'fetch-sms-task';
const MINIMUM_INTERVAL = 120; // in minutes

export type FinanceSms = {
  _id: string;
  address: string;
  body: string;
  date: number;
  timestamp?: number; // extra field for history
};

// Background task
export const initializeBackgroundTask = async (innerAppMountedPromise: Promise<void>) => {
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log('Background SMS task started');

    await innerAppMountedPromise;

    try {
      const messages: FinanceSms[] = await getFinanceInboxMessages();
      const db = await openDatabaseAsync('app.db');

      const lastSyncStr = await getConfig(db, 'lastSmsSync');
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
      const now = new Date();

      const inbox = await getFinanceInboxMessagesByDateRange(
        lastSync ? lastSync.getTime() : undefined,
        now.getTime(),
        200
      );

      const inserted = await insertSmsBatch(db, inbox, 'default', 1, 'sms');

      if (inserted.length > 0) {
        await setConfig(db, 'lastSmsSync', now.toISOString());
      }
      if (messages && messages.length > 0) {
        // SMS data is now stored directly in the database via insertSmsBatch
        console.log('New SMS received:', messages[0]);
      }
    } catch (error) {
      console.error('Error in background SMS task:', error);
    }

    console.log('Background SMS task done');
  });

  // Register task if not already registered
  if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER))) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: MINIMUM_INTERVAL, // in minutes
    });
    console.log(`Background SMS task registered`);
  }
};
