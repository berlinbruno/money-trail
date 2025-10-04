import {
  BackgroundTaskSummaryCard,
  PerformanceMetricsCard,
  RegisteredTasksCard,
} from '@/components/background';
import { useToastHelpers } from '@/contexts/ToastProvider';
import { getRecentTaskExecutionLogs } from '@/lib/database/loggingQueries';
import {
  DEFAULT_TASK_CONFIG,
  getTaskStatus,
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
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgExecutionTime: 0,
    successRate: 100,
    totalRuns: 0,
    totalMessages: 0,
  });
  const appState = useRef(AppState.currentState);

  const loadTaskStatus = useCallback(async () => {
    try {
      const taskStatus = await getTaskStatus();
      setRegisteredTasks(
        taskStatus.registeredTasks.length > 0
          ? taskStatus.registeredTasks
          : await TaskManager.getRegisteredTasksAsync()
      );
      setTaskConfig(taskStatus.config);
    } catch (error) {
      console.error('Error loading task status:', error);
      showError({
        title: 'Task Status Loading Failed',
        description: 'Unable to load background task status',
      });
    }
  }, [showError]);

  const loadPerformanceMetrics = useCallback(async () => {
    try {
      // Get task execution logs for metrics
      const logs = await getRecentTaskExecutionLogs(db);
      const taskLogs = logs.filter((log) => log.category === 'task_execution');

      // Set last execution time from most recent log
      if (taskLogs.length > 0) {
        const lastLog = taskLogs[0];
        setLastExecutionTime(new Date(lastLog.timestamp).toLocaleString());
      } else {
        setLastExecutionTime(null);
      }

      if (taskLogs.length === 0) {
        setPerformanceMetrics({
          avgExecutionTime: 0,
          successRate: 100,
          totalRuns: 0,
          totalMessages: 0,
        });
        return;
      }

      // Calculate metrics from logs
      let successfulRuns = 0;
      let totalExecutionTime = 0;
      let totalMessages = 0;
      let validExecutions = 0;

      successfulRuns = taskLogs.filter((log) => log.log_level !== 'error').length;
      taskLogs.forEach((log) => {
        try {
          const metadata = log.metadata ? JSON.parse(log.metadata) : {};
          if (metadata.executionTimeMs || metadata.execution_time_ms) {
            totalExecutionTime += metadata.executionTimeMs || metadata.execution_time_ms;
            validExecutions++;
          }
          if (metadata.messageCount || metadata.messages_processed) {
            totalMessages += metadata.messageCount || metadata.messages_processed;
          }
        } catch {
          // Ignore parsing errors
        }
      });

      const totalRuns = taskLogs.length;
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;
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
      await Promise.all([loadTaskStatus(), loadPerformanceMetrics()]);
      // Silent refresh - no toast needed for pull-to-refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Individual functions will show their own error toasts
    } finally {
      setIsLoading(false);
    }
  }, [loadTaskStatus, loadPerformanceMetrics]);

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
        lastExecutionTime={lastExecutionTime}
      />
      <PerformanceMetricsCard performanceMetrics={performanceMetrics} />
      <RegisteredTasksCard registeredTasks={registeredTasks} />
    </ScrollView>
  );
}
