import {
  BackgroundTaskSummaryCard,
  PerformanceMetricsCard,
  RegisteredTasksCard,
  TaskExecutionHistoryCard,
} from '@/components/background';
import {
  DEFAULT_TASK_CONFIG,
  getTaskConfig,
  initializeBackgroundTask,
} from '@/lib/sms/backgroundTask';
import { useSQLiteContext } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, RefreshControl, ScrollView } from 'react-native';

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
      const config = await getTaskConfig();
      setTaskConfig(config);
    } catch (error) {
      console.error('Error loading task config:', error);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadRegisteredTasks(), loadTaskHistory(), loadTaskConfig()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadRegisteredTasks, loadTaskHistory, loadTaskConfig]);

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
      <BackgroundTaskSummaryCard
        registeredTasks={registeredTasks}
        lastExecutionTime={lastExecutionTime}
        taskConfig={taskConfig}
        taskHistoryLength={taskHistory.length}
      />

      <PerformanceMetricsCard
        performanceMetrics={performanceMetrics}
        taskHistoryLength={taskHistory.length}
      />

      <RegisteredTasksCard registeredTasks={registeredTasks} />

      <TaskExecutionHistoryCard taskHistory={taskHistory} />
    </ScrollView>
  );
}
