import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FinanceSms, initializeBackgroundTask } from '@/lib/smsBackgroundTask';
import * as BackgroundTask from 'expo-background-task';
import { useSQLiteContext } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, ScrollView, View } from 'react-native';

// Promise resolver for background task init
let resolver: (() => void) | null;
const promise = new Promise<void>((resolve) => {
  resolver = resolve;
});
initializeBackgroundTask(promise);

// Extended type to include transaction details that might be joined with SMS data
type SmsWithTransaction = FinanceSms & {
  amount?: number;
  type?: 'credit' | 'debit';
};

export default function BackgroundTaskScreen() {
  const db = useSQLiteContext();
  const [smsHistory, setSmsHistory] = useState<SmsWithTransaction[]>([]);
  const [registeredTasks, setRegisteredTasks] = useState<TaskManager.TaskManagerTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const loadRegisteredTasks = useCallback(async () => {
    try {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      setRegisteredTasks(tasks);
    } catch (error) {
      console.error('Error loading registered tasks:', error);
    }
  }, []);

  const loadTaskHistory = useCallback(async () => {
    try {
      // Get task execution history from config table if it exists
      const result = await db.getAllAsync<{ key: string; value: string }>(
        `SELECT * FROM config 
         WHERE key LIKE 'task_execution_%' 
         ORDER BY key DESC 
         LIMIT 10`
      );

      if (result && result.length > 0) {
        const history = result.map((item) => {
          try {
            return JSON.parse(item.value);
          } catch {
            return { timestamp: item.value, status: 'Unknown' };
          }
        });
        setTaskHistory(history);

        // Set last execution time
        if (history.length > 0 && history[0].timestamp) {
          setLastExecutionTime(new Date(history[0].timestamp).toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error loading task history:', error);
    }
  }, [db]);

  const loadSmsHistory = useCallback(async () => {
    try {
      // Get the latest processed SMS from the database
      const result = await db.getAllAsync<SmsWithTransaction>(
        `SELECT t.*, tr.amount, tr.type 
         FROM transactions t
         LEFT JOIN transactions tr ON t.sms_hash = tr.sms_hash
         WHERE t.source = 'sms' 
         ORDER BY t.date DESC 
         LIMIT 50`
      );

      if (result && result.length > 0) {
        setSmsHistory(result);
      }
    } catch (error) {
      console.error('Error loading SMS history:', error);
    }
  }, [db]);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadSmsHistory(), loadRegisteredTasks(), loadTaskHistory()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadSmsHistory, loadRegisteredTasks, loadTaskHistory]);

  // Record task execution for history
  const recordTaskExecution = async () => {
    try {
      const timestamp = new Date().toISOString();
      const executionData = {
        timestamp,
        status: 'Manually Triggered',
        details: 'Task was manually triggered for testing',
      };

      const key = `task_execution_${Date.now()}`;
      await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
        key,
        JSON.stringify(executionData),
      ]);

      // Refresh data
      await loadTaskHistory();
    } catch (error) {
      console.error('Error recording task execution:', error);
    }
  };

  useEffect(() => {
    // Resolve when inner app is mounted
    if (resolver) {
      resolver();
      console.log('Resolver called');
    }

    // Load initial data
    refreshAllData();

    // Listen to app state changes
    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App foregrounded, reload data');
        refreshAllData();
      }
      if (appState.current.match(/active/) && nextAppState === 'background') {
        console.log('App backgrounded');
      }
      appState.current = nextAppState;
    });

    return () => {
      sub.remove();
    };
  }, [refreshAllData]);

  return (
    <View className="flex-1 p-4">
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-background/70">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <View className="mb-4 flex flex-row items-center justify-between">
        <Text variant="h3">Background Tasks</Text>
      </View>
      <View className="flex flex-col gap-2">
        <Button variant="outline" onPress={refreshAllData}>
          <Text>Refresh</Text>
        </Button>
        <Button
          variant="default"
          onPress={async () => {
            setIsLoading(true);
            try {
              await BackgroundTask.triggerTaskWorkerForTestingAsync();
              await recordTaskExecution();
              await refreshAllData();
            } finally {
              setIsLoading(false);
            }
          }}>
          <Text className="text-white">Run Task</Text>
        </Button>
      </View>
      <ScrollView className="flex-1">
        {/* Last Execution Summary */}
        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text variant="h4" className="mb-2">
            Background Task Summary
          </Text>
          <View className="flex-row justify-between border-b border-border py-2">
            <Text className="font-medium">Status:</Text>
            <Text className={lastExecutionTime ? 'text-green-600' : 'text-amber-600'}>
              {lastExecutionTime ? 'Active' : 'No Recent Executions'}
            </Text>
          </View>
          {lastExecutionTime && (
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Last Execution:</Text>
              <Text>{lastExecutionTime}</Text>
            </View>
          )}
          <View className="flex-row justify-between border-b border-border py-2">
            <Text className="font-medium">Registered Tasks:</Text>
            <Text>{registeredTasks.length}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="font-medium">SMS Messages Processed:</Text>
            <Text>{smsHistory.length}</Text>
          </View>
        </View>

        {/* Registered Tasks Section */}
        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text variant="h4" className="mb-2">
            Registered Tasks
          </Text>
          {registeredTasks.length > 0 ? (
            registeredTasks.map((task, index) => (
              <View key={index} className="mb-2 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <Text variant="large">{task.taskName}</Text>
                <Text variant="small" className="text-gray-500">
                  Type: {task.taskType}
                </Text>
                {task.options && (
                  <>
                    <Text variant="small" className="text-gray-500">
                      Interval: {task.options.minimumInterval} minutes
                    </Text>
                    {task.options.requiredNetworkType && (
                      <Text variant="small" className="text-gray-500">
                        Network: {task.options.requiredNetworkType}
                      </Text>
                    )}
                  </>
                )}
              </View>
            ))
          ) : (
            <Text className="italic text-gray-500">No registered tasks found</Text>
          )}
        </View>

        {/* Task Execution History */}
        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text variant="h4" className="mb-2">
            Task Execution History
          </Text>
          {taskHistory.length > 0 ? (
            taskHistory.map((execution, index) => (
              <View key={index} className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                <View className="flex-row justify-between">
                  <Text className="font-medium">{execution.status || 'Executed'}</Text>
                  <Text className="text-xs text-gray-500">
                    {execution.timestamp
                      ? new Date(execution.timestamp).toLocaleString()
                      : 'Unknown time'}
                  </Text>
                </View>
                {execution.details && (
                  <Text className="mt-1 text-sm text-gray-600">{execution.details}</Text>
                )}
              </View>
            ))
          ) : (
            <Text className="italic text-gray-500">No task execution history found</Text>
          )}
        </View>

        {/* SMS History Section */}
        <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
          <Text variant="h4" className="mb-2">
            Latest SMS
          </Text>
          {smsHistory.length > 0 ? (
            <View className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <Text className="font-bold">From: {smsHistory[0].address}</Text>
              <Text className="my-1">{smsHistory[0].body}</Text>
              <View className="flex-row justify-between">
                {smsHistory[0].amount && smsHistory[0].type && (
                  <Text className="text-xs text-gray-500">
                    {smsHistory[0].type === 'credit' ? 'Credit' : 'Debit'} - {smsHistory[0].amount}{' '}
                    ₹
                  </Text>
                )}
                <Text className="text-right text-xs text-gray-500">
                  {new Date(smsHistory[0].date).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="italic text-gray-500">No SMS captured yet</Text>
          )}
        </View>

        {/* Previous SMS Section */}
        {smsHistory.length > 1 && (
          <View className="mb-6 rounded-lg bg-card p-4 shadow-sm">
            <Text variant="h4" className="mb-2">
              Previous SMS
            </Text>
            {smsHistory.slice(1).map((sms, index) => (
              <View
                key={index}
                className="mb-2 rounded-lg bg-gray-100 p-4 opacity-80 dark:bg-gray-800">
                <Text className="font-bold">From: {sms.address}</Text>
                <Text className="my-1">{sms.body}</Text>
                <View className="flex-row justify-between">
                  {sms.amount && sms.type && (
                    <Text className="text-xs text-gray-500">
                      {sms.type === 'credit' ? 'Credit' : 'Debit'} - {sms.amount} ₹
                    </Text>
                  )}
                  <Text className="text-right text-xs text-gray-500">
                    {new Date(sms.date).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
