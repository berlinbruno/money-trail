import {
  BackgroundTaskSummaryCard,
  PerformanceMetricsCard,
  RegisteredTasksCard,
} from '@/components/background';
import { useToastHelpers } from '@/contexts/ToastProvider';
import { getRecentTaskExecutionLogs } from '@/lib/database/loggingQueries';
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
  const { showError } = useToastHelpers();
  const [registeredTasks, setRegisteredTasks] = useState<TaskManager.TaskManagerTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      showError({
        title: 'Task Loading Failed',
        description: 'Unable to load background task information',
      });
    }
  }, [showError]);

  const loadTaskConfig = useCallback(async () => {
    try {
      const config = await getTaskConfig();
      setTaskConfig(config);
    } catch (error) {
      console.error('Error loading task config:', error);
      showError({
        title: 'Config Loading Failed',
        description: 'Unable to load task configuration',
      });
    }
  }, [showError]);

  const loadPerformanceMetrics = useCallback(async () => {
    try {
      const logs = await getRecentTaskExecutionLogs(db);
      const taskLogs = logs.filter((log) => log.category === 'task_execution');

      if (taskLogs.length === 0) {
        return;
      }

      // Calculate metrics from logs
      const successfulRuns = taskLogs.filter((log) => log.log_level !== 'error').length;
      const totalRuns = taskLogs.length;
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

      // Extract execution times and message counts from log details
      let totalExecutionTime = 0;
      let totalMessages = 0;
      let validExecutions = 0;

      taskLogs.forEach((log) => {
        try {
          const details = JSON.parse(log.details || '{}');
          if (details.executionTimeMs) {
            totalExecutionTime += details.executionTimeMs;
            validExecutions++;
          }
          if (details.messageCount) {
            totalMessages += details.messageCount;
          }
        } catch {
          // Ignore parsing errors
        }
      });

      const avgExecutionTime = validExecutions > 0 ? totalExecutionTime / validExecutions : 0;

      setPerformanceMetrics({
        avgExecutionTime: Math.round(avgExecutionTime),
        successRate: Math.round(successRate * 100) / 100,
        totalRuns,
        totalMessages,
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      showError({
        title: 'Metrics Loading Failed',
        description: 'Unable to load performance data',
      });
    }
  }, [db, showError]);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadRegisteredTasks(), loadTaskConfig(), loadPerformanceMetrics()]);
      // Silent refresh - no toast needed for pull-to-refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Individual functions will show their own error toasts
    } finally {
      setIsLoading(false);
    }
  }, [loadRegisteredTasks, loadTaskConfig, loadPerformanceMetrics]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Safe to disable - we only want this to run once on mount

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAllData} />}>
      <BackgroundTaskSummaryCard
        registeredTasks={registeredTasks}
        taskConfig={taskConfig}
        lastExecutionTime={null}
        taskHistoryLength={0}
      />
      <PerformanceMetricsCard performanceMetrics={performanceMetrics} taskHistoryLength={0} />
      <RegisteredTasksCard registeredTasks={registeredTasks} />
    </ScrollView>
  );
}
