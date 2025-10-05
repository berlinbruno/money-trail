import {
  BackgroundTaskSummaryCard,
  PerformanceMetricsCard,
  RegisteredTasksCard,
} from '@/components/background';
import { useToast } from '@/contexts/ToastProvider';
import {
  DEFAULT_TASK_CONFIG,
  getSyncHistory,
  getSyncStatistics,
  getTaskStatus,
  initializeBackgroundTask,
} from '@/lib/sms/backgroundTask';
import { useFocusEffect } from '@react-navigation/native';
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
  const { showToast } = useToast();
  const [registeredTasks, setRegisteredTasks] = useState<TaskManager.TaskManagerTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskConfig, setTaskConfig] = useState({ ...DEFAULT_TASK_CONFIG });
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const [historyLength, setHistoryLength] = useState(0);
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
      showToast('Failed to load task status');
    }
  }, [showToast]);

  const loadPerformanceMetrics = useCallback(async () => {
    try {
      // Get sync statistics from database
      const stats = await getSyncStatistics(db);
      const history = await getSyncHistory(db, 10);

      // Set last execution time from statistics
      setLastExecutionTime(
        stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : null
      );

      if (!stats) {
        setPerformanceMetrics({
          avgExecutionTime: 0,
          successRate: 100,
          totalRuns: 0,
          totalMessages: 0,
        });
        return;
      }

      setPerformanceMetrics({
        avgExecutionTime: Math.round(stats.avgExecutionTime),
        successRate: Math.round(stats.successRate * 100) / 100,
        totalRuns: stats.totalSyncs,
        totalMessages: stats.totalMessagesProcessed,
      });

      // Set history length for UI components
      setHistoryLength(history.length);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      showToast('Failed to load metrics');
    }
  }, [db, showToast]);

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

  // Refresh data when screen is focused (e.g., returning from settings)
  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [refreshAllData])
  );

  useEffect(() => {
    // Resolve when inner app is mounted
    if (resolver) {
      resolver();
      console.log('Resolver called');
    }

    // Load initial data
    refreshAllData();

    // Listen to app state changes for background/foreground transitions
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
        taskHistoryLength={historyLength}
      />
      <PerformanceMetricsCard
        performanceMetrics={performanceMetrics}
        taskHistoryLength={historyLength}
      />
      <RegisteredTasksCard registeredTasks={registeredTasks} />
    </ScrollView>
  );
}
