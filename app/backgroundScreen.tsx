import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  BACKGROUND_TASK_OPTIONS,
  DEFAULT_TASK_CONFIG,
  getTaskConfig,
  initializeBackgroundTask,
} from '@/lib/smsBackgroundTask';
import { useSQLiteContext } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, RefreshControl, ScrollView, View } from 'react-native';

// Promise resolver for background task init
let resolver: (() => void) | null = null;
const promise = new Promise<void>((resolve) => {
  resolver = resolve;
});
initializeBackgroundTask(promise);

export default function BackgroundTaskScreen() {
  const db = useSQLiteContext();
  const [registeredTasks, setRegisteredTasks] = useState<TaskManager.TaskManagerTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const [taskConfig, setTaskConfig] = useState({ ...DEFAULT_TASK_CONFIG });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgExecutionTime: 0,
    successRate: 100,
    totalRuns: 0,
    totalMessages: 0,
  });
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

        // Calculate performance metrics
        if (history.length > 0) {
          const successfulRuns = history.filter((run) => run.status === 'Completed').length;
          const totalRuns = history.length;
          const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

          // Calculate average execution time for successful runs
          const executionTimes = history
            .filter((run) => run.executionTimeMs && run.status === 'Completed')
            .map((run) => run.executionTimeMs as number);

          const avgExecutionTime =
            executionTimes.length > 0
              ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
              : 0;

          // Calculate total messages processed
          const totalMessages = history.reduce((sum, run) => sum + (run.messageCount || 0), 0);

          setPerformanceMetrics({
            avgExecutionTime,
            successRate,
            totalRuns,
            totalMessages,
          });
        }
      }
    } catch (error) {
      console.error('Error loading task history:', error);
    }
  }, [db]);

  // Load task configuration
  const loadTaskConfig = useCallback(async () => {
    try {
      const config = await getTaskConfig(db);
      setTaskConfig(config);
    } catch (error) {
      console.error('Error loading task config:', error);
    }
  }, [db]);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadRegisteredTasks(), loadTaskHistory(), loadTaskConfig()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadRegisteredTasks, loadTaskHistory, loadTaskConfig]);

  // Memoized components for better performance
  const PerformanceMetricsCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {taskHistory.length > 0 ? (
            <>
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Success Rate:</Text>
                <Text
                  className={
                    performanceMetrics.successRate > 80 ? 'text-green-600' : 'text-amber-600'
                  }>
                  {performanceMetrics.successRate.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Avg. Execution Time:</Text>
                <Text>{(performanceMetrics.avgExecutionTime / 1000).toFixed(2)} sec</Text>
              </View>
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Total Executions:</Text>
                <Text>{performanceMetrics.totalRuns}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="font-medium">Total Messages Processed:</Text>
                <Text>{performanceMetrics.totalMessages}</Text>
              </View>
            </>
          ) : (
            <Text className="italic text-gray-500">No performance data available</Text>
          )}
        </CardContent>
      </Card>
    ),
    [performanceMetrics, taskHistory.length]
  );

  const RegisteredTasksCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Registered Tasks</CardTitle>
        </CardHeader>
        <CardContent>
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
                    {task.options.stopOnTerminate !== undefined && (
                      <Text variant="small" className="text-gray-500">
                        Stop on Terminate: {task.options.stopOnTerminate ? 'Yes' : 'No'}
                      </Text>
                    )}
                    {task.options.startOnBoot !== undefined && (
                      <Text variant="small" className="text-gray-500">
                        Start on Boot: {task.options.startOnBoot ? 'Yes' : 'No'}
                      </Text>
                    )}
                  </>
                )}
              </View>
            ))
          ) : (
            <Text className="italic text-gray-500">No registered tasks found</Text>
          )}
        </CardContent>
      </Card>
    ),
    [registeredTasks]
  );

  const TaskExecutionHistoryCard = useMemo(
    () => (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Task Execution History</CardTitle>
        </CardHeader>
        <CardContent>
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
                {execution.messageCount !== undefined && (
                  <Text className="mt-1 text-xs text-gray-500">
                    Messages processed: {execution.messageCount}
                  </Text>
                )}
                {execution.error && (
                  <Text className="mt-1 text-xs text-red-500">Error: {execution.error}</Text>
                )}
              </View>
            ))
          ) : (
            <Text className="italic text-gray-500">No task execution history found</Text>
          )}
        </CardContent>
      </Card>
    ),
    [taskHistory]
  );

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
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAllData} />}>
      {/* Background Task Summary */}
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Background Task Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {registeredTasks.length > 0 ? (
            <>
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
                <Text className="text-primary">{registeredTasks.length}</Text>
              </View>
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Task Settings:</Text>
                <Text>
                  Every {taskConfig.intervalMinutes || BACKGROUND_TASK_OPTIONS.minimumInterval} min
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="font-medium">Task History Records:</Text>
                <Text className="text-primary">{taskHistory.length}</Text>
              </View>
            </>
          ) : (
            <Text className="italic text-gray-500">No background tasks registered</Text>
          )}
        </CardContent>
      </Card>

      {PerformanceMetricsCard}

      {RegisteredTasksCard}

      {TaskExecutionHistoryCard}
    </ScrollView>
  );
}
