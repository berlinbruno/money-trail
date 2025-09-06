import AsyncStorage from '@react-native-async-storage/async-storage';
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
const SMS_HISTORY_KEY = '@sms_history';
const MAX_HISTORY_ITEMS = 50; // keep more SMS than quotes

export type FinanceSms = {
  _id: string;
  address: string;
  body: string;
  date: number;
  timestamp?: number; // extra field for history
};

export type SmsHistory = (FinanceSms & { timestamp: number })[];

// Store SMS in history
export const storeSmsInHistory = async (sms: FinanceSms) => {
  try {
    const historyJson = await AsyncStorage.getItem(SMS_HISTORY_KEY);
    const history: SmsHistory = historyJson ? JSON.parse(historyJson) : [];

    // add new SMS with timestamp
    const newSms = {
      ...sms,
      timestamp: Date.now(),
    };

    const updatedHistory = [newSms, ...history].slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(updatedHistory));

    return updatedHistory;
  } catch (error) {
    console.error('Error storing SMS:', error);
    return null;
  }
};

// Get SMS history
export const getSmsHistory = async (): Promise<SmsHistory | null> => {
  try {
    const historyJson = await AsyncStorage.getItem(SMS_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : null;
  } catch (error) {
    console.error('Error getting SMS history:', error);
    return null;
  }
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
        // just take first new message for now
        await storeSmsInHistory(messages[0]);
        console.log('Stored SMS:', messages[0]);
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
