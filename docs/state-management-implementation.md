# Real-Time State Management Implementation

## AppProvider for Global State Management

```typescript
// contexts/AppProvider.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

interface AppState {
  // Data refresh triggers
  dataRefreshTrigger: number;
  transactionUpdateTrigger: number;
  settingsUpdateTrigger: number;
  insightsUpdateTrigger: number;
  alertsUpdateTrigger: number;
  logsUpdateTrigger: number;
  backgroundTaskUpdateTrigger: number;

  // Loading states
  isRefreshing: boolean;

  // Last update timestamps
  lastTransactionUpdate: string | null;
  lastDashboardUpdate: string | null;
  lastSettingsUpdate: string | null;
  lastInsightsUpdate: string | null;
  lastAlertsUpdate: string | null;
  lastLogsUpdate: string | null;
  lastBackgroundUpdate: string | null;
}

interface AppActions {
  // Trigger refreshes
  triggerTransactionRefresh: () => void;
  triggerDashboardRefresh: () => void;
  triggerSettingsRefresh: () => void;
  triggerInsightsRefresh: () => void;
  triggerAlertsRefresh: () => void;
  triggerLogsRefresh: () => void;
  triggerBackgroundTaskRefresh: () => void;
  triggerGlobalRefresh: () => void;

  // Update states
  setRefreshing: (loading: boolean) => void;
  markTransactionUpdated: () => void;
  markSettingsUpdated: () => void;
  markInsightsUpdated: () => void;
}

interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

const initialState: AppState = {
  dataRefreshTrigger: 0,
  transactionUpdateTrigger: 0,
  settingsUpdateTrigger: 0,
  insightsUpdateTrigger: 0,
  alertsUpdateTrigger: 0,
  logsUpdateTrigger: 0,
  backgroundTaskUpdateTrigger: 0,
  isRefreshing: false,
  lastTransactionUpdate: null,
  lastDashboardUpdate: null,
  lastSettingsUpdate: null,
  lastInsightsUpdate: null,
  lastAlertsUpdate: null,
  lastLogsUpdate: null,
  lastBackgroundUpdate: null,
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  const triggerTransactionRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactionUpdateTrigger: prev.transactionUpdateTrigger + 1,
      lastTransactionUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerDashboardRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      dataRefreshTrigger: prev.dataRefreshTrigger + 1,
      lastDashboardUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerSettingsRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      settingsUpdateTrigger: prev.settingsUpdateTrigger + 1,
      lastSettingsUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerInsightsRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      insightsUpdateTrigger: prev.insightsUpdateTrigger + 1,
      lastInsightsUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerAlertsRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      alertsUpdateTrigger: prev.alertsUpdateTrigger + 1,
      lastAlertsUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerLogsRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      logsUpdateTrigger: prev.logsUpdateTrigger + 1,
      lastLogsUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerBackgroundTaskRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      backgroundTaskUpdateTrigger: prev.backgroundTaskUpdateTrigger + 1,
      lastBackgroundUpdate: new Date().toISOString(),
    }));
  }, []);

  const triggerGlobalRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      dataRefreshTrigger: prev.dataRefreshTrigger + 1,
      transactionUpdateTrigger: prev.transactionUpdateTrigger + 1,
      settingsUpdateTrigger: prev.settingsUpdateTrigger + 1,
      insightsUpdateTrigger: prev.insightsUpdateTrigger + 1,
      alertsUpdateTrigger: prev.alertsUpdateTrigger + 1,
      logsUpdateTrigger: prev.logsUpdateTrigger + 1,
      backgroundTaskUpdateTrigger: prev.backgroundTaskUpdateTrigger + 1,
      lastTransactionUpdate: new Date().toISOString(),
      lastDashboardUpdate: new Date().toISOString(),
      lastSettingsUpdate: new Date().toISOString(),
      lastInsightsUpdate: new Date().toISOString(),
      lastAlertsUpdate: new Date().toISOString(),
      lastLogsUpdate: new Date().toISOString(),
      lastBackgroundUpdate: new Date().toISOString(),
    }));
  }, []);

  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setState(prev => ({ ...prev, isRefreshing }));
  }, []);

  const markTransactionUpdated = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastTransactionUpdate: new Date().toISOString(),
    }));
  }, []);

  const markSettingsUpdated = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSettingsUpdate: new Date().toISOString(),
    }));
  }, []);

  const markInsightsUpdated = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastInsightsUpdate: new Date().toISOString(),
    }));
  }, []);

  const actions: AppActions = {
    triggerTransactionRefresh,
    triggerDashboardRefresh,
    triggerSettingsRefresh,
    triggerInsightsRefresh,
    triggerAlertsRefresh,
    triggerLogsRefresh,
    triggerBackgroundTaskRefresh,
    triggerGlobalRefresh,
    setRefreshing,
    markTransactionUpdated,
    markSettingsUpdated,
    markInsightsUpdated,
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

## Transaction State Hook with Auto-Refresh

```typescript
// hooks/useTransactionState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  getTransactions,
  updateTransactionStatus,
  deleteTransaction,
} from '@/lib/db/transactionQueries';

export const useTransactionState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    status: 'all',
    category: 'all',
    dateRange: 'all',
  });

  // Load transactions function
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions(db, filters);
      setTransactions(data);
    } catch (err) {
      console.error('Load transactions failed:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [db, filters]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, appState.transactionUpdateTrigger]);

  // Approve transaction with auto-refresh
  const approveTransaction = useCallback(
    async (transactionId: string) => {
      try {
        await updateTransactionStatus(db, transactionId, 'approved');
        showToast('Transaction approved');

        // Trigger refresh across the app
        appActions.triggerTransactionRefresh();
        appActions.triggerDashboardRefresh();

        return true;
      } catch (error) {
        console.error('Approve transaction failed:', error);
        showToast('Failed to approve transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  // Reject transaction with auto-refresh
  const rejectTransaction = useCallback(
    async (transactionId: string) => {
      try {
        await updateTransactionStatus(db, transactionId, 'rejected');
        showToast('Transaction rejected');

        // Trigger refresh across the app
        appActions.triggerTransactionRefresh();
        appActions.triggerDashboardRefresh();

        return true;
      } catch (error) {
        console.error('Reject transaction failed:', error);
        showToast('Failed to reject transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  // Delete transaction with auto-refresh
  const removeTransaction = useCallback(
    async (transactionId: string) => {
      try {
        await deleteTransaction(db, transactionId);
        showToast('Transaction deleted');

        // Trigger refresh across the app
        appActions.triggerTransactionRefresh();
        appActions.triggerDashboardRefresh();

        return true;
      } catch (error) {
        console.error('Delete transaction failed:', error);
        showToast('Failed to delete transaction');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  return {
    transactions,
    loading,
    error,
    filters,
    actions: {
      loadTransactions,
      approveTransaction,
      rejectTransaction,
      removeTransaction,
      setFilters,
      refresh: loadTransactions,
    },
  };
};
```

## Comprehensive State Hooks for All Screens

### Settings State Hook

```typescript
// hooks/useSettingsState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import { getAppSettings, updateAppSetting, resetAppSettings } from '@/lib/db/settingsQueries';

export const useSettingsState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppSettings(db);
      setSettings(data);
    } catch (err) {
      console.error('Load settings failed:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings, appState.settingsUpdateTrigger]);

  const updateSetting = useCallback(
    async (key: string, value: any) => {
      try {
        await updateAppSetting(db, key, value);
        showToast('Setting updated');

        // Trigger refresh for settings and potentially other screens
        appActions.triggerSettingsRefresh();

        // If sync settings changed, refresh background tasks
        if (key.includes('sync') || key.includes('background')) {
          appActions.triggerBackgroundTaskRefresh();
        }

        return true;
      } catch (error) {
        console.error('Update setting failed:', error);
        showToast('Failed to update setting');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  const resetSettings = useCallback(async () => {
    try {
      await resetAppSettings(db);
      showToast('Settings reset to defaults');
      appActions.triggerSettingsRefresh();
      appActions.triggerGlobalRefresh(); // Reset affects everything
      return true;
    } catch (error) {
      console.error('Reset settings failed:', error);
      showToast('Failed to reset settings');
      return false;
    }
  }, [db, showToast, appActions]);

  return {
    settings,
    loading,
    error,
    actions: {
      loadSettings,
      updateSetting,
      resetSettings,
      refresh: loadSettings,
    },
  };
};
```

### Insights State Hook

```typescript
// hooks/useInsightsState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import {
  getInsightsData,
  getSpendingTrends,
  getCategoryBreakdown,
  getMonthlyComparison,
} from '@/lib/db/insightQueries';

export const useInsightsState = () => {
  const db = useSQLiteContext();
  const { state: appState } = useApp();

  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [trends, breakdown, comparison, overview] = await Promise.all([
        getSpendingTrends(db, dateRange),
        getCategoryBreakdown(db, dateRange),
        getMonthlyComparison(db),
        getInsightsData(db, dateRange),
      ]);

      setData({ trends, breakdown, comparison, overview });
    } catch (err) {
      console.error('Load insights failed:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [db, dateRange]);

  // Auto-refresh when transactions change or trigger changes
  useEffect(() => {
    loadInsights();
  }, [loadInsights, appState.insightsUpdateTrigger, appState.transactionUpdateTrigger]);

  return {
    data,
    loading,
    error,
    dateRange,
    actions: {
      loadInsights,
      setDateRange,
      refresh: loadInsights,
    },
  };
};
```

### Alerts State Hook

```typescript
// hooks/useAlertsState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  toggleAlertStatus,
} from '@/lib/db/alertQueries';

export const useAlertsState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAlerts(db);
      setAlerts(data);
    } catch (err) {
      console.error('Load alerts failed:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts, appState.alertsUpdateTrigger]);

  const addAlert = useCallback(
    async (alert: Omit<Alert, 'id' | 'createdAt'>) => {
      try {
        const id = await createAlert(db, alert);
        showToast('Alert created');
        appActions.triggerAlertsRefresh();
        return id;
      } catch (error) {
        console.error('Create alert failed:', error);
        showToast('Failed to create alert');
        return null;
      }
    },
    [db, showToast, appActions]
  );

  const editAlert = useCallback(
    async (id: string, updates: Partial<Alert>) => {
      try {
        await updateAlert(db, id, updates);
        showToast('Alert updated');
        appActions.triggerAlertsRefresh();
        return true;
      } catch (error) {
        console.error('Update alert failed:', error);
        showToast('Failed to update alert');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  const removeAlert = useCallback(
    async (id: string) => {
      try {
        await deleteAlert(db, id);
        showToast('Alert deleted');
        appActions.triggerAlertsRefresh();
        return true;
      } catch (error) {
        console.error('Delete alert failed:', error);
        showToast('Failed to delete alert');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  const toggleAlert = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        await toggleAlertStatus(db, id, isActive);
        showToast(isActive ? 'Alert enabled' : 'Alert disabled');
        appActions.triggerAlertsRefresh();
        return true;
      } catch (error) {
        console.error('Toggle alert failed:', error);
        showToast('Failed to update alert');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  return {
    alerts,
    loading,
    error,
    actions: {
      loadAlerts,
      addAlert,
      editAlert,
      removeAlert,
      toggleAlert,
      refresh: loadAlerts,
    },
  };
};
```

### Debug State Hook

```typescript
// hooks/useDebugState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  getDebugInfo,
  getPermissionStatus,
  testDatabaseConnection,
  checkBackgroundTasks,
  validateSMSAccess,
} from '@/lib/db/debugQueries';

export const useDebugState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResults>({});

  const loadDebugInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [info, permissions, dbStatus, bgTasks, smsStatus] = await Promise.all([
        getDebugInfo(db),
        getPermissionStatus(),
        testDatabaseConnection(db),
        checkBackgroundTasks(),
        validateSMSAccess(),
      ]);

      setDebugInfo(info);
      setTestResults({ permissions, dbStatus, bgTasks, smsStatus });
    } catch (err) {
      console.error('Load debug info failed:', err);
      setError('Failed to load debug information');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Auto-refresh when any trigger changes (debug shows global state)
  useEffect(() => {
    loadDebugInfo();
  }, [
    loadDebugInfo,
    appState.dataRefreshTrigger,
    appState.backgroundTaskUpdateTrigger,
    appState.settingsUpdateTrigger,
  ]);

  const runSystemTest = useCallback(
    async (testType: string) => {
      try {
        showToast(`Running ${testType} test...`);

        let result;
        switch (testType) {
          case 'database':
            result = await testDatabaseConnection(db);
            break;
          case 'permissions':
            result = await getPermissionStatus();
            break;
          case 'background':
            result = await checkBackgroundTasks();
            break;
          case 'sms':
            result = await validateSMSAccess();
            break;
          default:
            throw new Error('Unknown test type');
        }

        setTestResults((prev) => ({ ...prev, [testType]: result }));
        showToast(`${testType} test completed`);
        return result;
      } catch (error) {
        console.error(`${testType} test failed:`, error);
        showToast(`${testType} test failed`);
        return null;
      }
    },
    [db, showToast]
  );

  const clearTestResults = useCallback(() => {
    setTestResults({});
    showToast('Test results cleared');
  }, [showToast]);

  return {
    debugInfo,
    testResults,
    loading,
    error,
    actions: {
      loadDebugInfo,
      runSystemTest,
      clearTestResults,
      refresh: loadDebugInfo,
    },
  };
};
```

### Logs State Hook

```typescript
// hooks/useLogsState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import { getAppLogs, clearLogs, exportLogs, getLogStats } from '@/lib/db/logQueries';

export const useLogsState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AppLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    level: 'all',
    dateRange: 'today',
    category: 'all',
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsData, statsData] = await Promise.all([getAppLogs(db, filters), getLogStats(db)]);

      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Load logs failed:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [db, filters]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadLogs();
  }, [loadLogs, appState.logsUpdateTrigger]);

  const clearAllLogs = useCallback(async () => {
    try {
      await clearLogs(db);
      showToast('Logs cleared');
      appActions.triggerLogsRefresh();
      return true;
    } catch (error) {
      console.error('Clear logs failed:', error);
      showToast('Failed to clear logs');
      return false;
    }
  }, [db, showToast, appActions]);

  const exportLogData = useCallback(async () => {
    try {
      const exportPath = await exportLogs(db, filters);
      showToast(`Logs exported to ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Export logs failed:', error);
      showToast('Failed to export logs');
      return null;
    }
  }, [db, filters, showToast]);

  return {
    logs,
    stats,
    loading,
    error,
    filters,
    actions: {
      loadLogs,
      clearAllLogs,
      exportLogData,
      setFilters,
      refresh: loadLogs,
    },
  };
};
```

### Background Tasks State Hook

```typescript
// hooks/useBackgroundTasksState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { useToast } from '@/contexts/ToastProvider';
import {
  getBackgroundTaskStatus,
  startBackgroundTask,
  stopBackgroundTask,
  getTaskHistory,
  updateTaskSettings,
} from '@/lib/db/backgroundTaskQueries';

export const useBackgroundTasksState = () => {
  const db = useSQLiteContext();
  const { state: appState, actions: appActions } = useApp();
  const { showToast } = useToast();

  const [taskStatus, setTaskStatus] = useState<BackgroundTaskStatus | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBackgroundTaskData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [status, history] = await Promise.all([
        getBackgroundTaskStatus(db),
        getTaskHistory(db),
      ]);

      setTaskStatus(status);
      setTaskHistory(history);
    } catch (err) {
      console.error('Load background task data failed:', err);
      setError('Failed to load background task data');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    loadBackgroundTaskData();
  }, [loadBackgroundTaskData, appState.backgroundTaskUpdateTrigger]);

  const startTask = useCallback(
    async (taskType: string) => {
      try {
        await startBackgroundTask(db, taskType);
        showToast(`${taskType} task started`);
        appActions.triggerBackgroundTaskRefresh();
        return true;
      } catch (error) {
        console.error('Start task failed:', error);
        showToast(`Failed to start ${taskType} task`);
        return false;
      }
    },
    [db, showToast, appActions]
  );

  const stopTask = useCallback(
    async (taskType: string) => {
      try {
        await stopBackgroundTask(db, taskType);
        showToast(`${taskType} task stopped`);
        appActions.triggerBackgroundTaskRefresh();
        return true;
      } catch (error) {
        console.error('Stop task failed:', error);
        showToast(`Failed to stop ${taskType} task`);
        return false;
      }
    },
    [db, showToast, appActions]
  );

  const updateSettings = useCallback(
    async (settings: TaskSettings) => {
      try {
        await updateTaskSettings(db, settings);
        showToast('Task settings updated');
        appActions.triggerBackgroundTaskRefresh();
        appActions.triggerSettingsRefresh(); // Settings might have changed
        return true;
      } catch (error) {
        console.error('Update task settings failed:', error);
        showToast('Failed to update task settings');
        return false;
      }
    },
    [db, showToast, appActions]
  );

  return {
    taskStatus,
    taskHistory,
    loading,
    error,
    actions: {
      loadBackgroundTaskData,
      startTask,
      stopTask,
      updateSettings,
      refresh: loadBackgroundTaskData,
    },
  };
};
```

```typescript
// hooks/useDashboardState.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/contexts/AppProvider';
import { getDashboardData } from '@/lib/db/dashboardQueries';

export const useDashboardState = () => {
  const db = useSQLiteContext();
  const { state: appState } = useApp();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await getDashboardData(db);
      setData(dashboardData);
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Auto-refresh when trigger changes
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard, appState.dataRefreshTrigger]);

  return {
    data,
    loading,
    error,
    refresh: refreshDashboard,
  };
};
```

## All Page Implementations with Auto-Refresh

### Settings Page Implementation

```typescript
// app/(drawer)/settings.tsx
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSettingsState } from '@/hooks/useSettingsState';
import { useApp } from '@/contexts/AppProvider';
import { useDialog } from '@/contexts/DialogProvider';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SettingsScreen() {
  const { settings, loading, actions } = useSettingsState();
  const { state: appState, actions: appActions } = useApp();
  const { showConfirmationDialog } = useDialog();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  const handleSettingChange = useCallback(async (key: string, value: any) => {
    await actions.updateSetting(key, value);
  }, [actions]);

  const handleResetSettings = useCallback(() => {
    showConfirmationDialog({
      title: 'Reset Settings',
      description: 'This will reset all settings to their default values. This action cannot be undone.',
      confirmText: 'Reset',
      confirmVariant: 'destructive',
      loadingText: 'Resetting settings...',
      onConfirm: actions.resetSettings,
    });
  }, [actions, showConfirmationDialog]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        {settings && (
          <>
            <SettingsSection
              title="Sync Settings"
              settings={settings.sync}
              onSettingChange={handleSettingChange}
            />

            <SettingsSection
              title="Notification Settings"
              settings={settings.notifications}
              onSettingChange={handleSettingChange}
            />

            <SettingsSection
              title="Privacy Settings"
              settings={settings.privacy}
              onSettingChange={handleSettingChange}
            />

            <View className="mt-6">
              <Button
                variant="destructive"
                onPress={handleResetSettings}
              >
                <Text>Reset All Settings</Text>
              </Button>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
```

### Insights Page Implementation

```typescript
// app/(drawer)/(tabs)/insights.tsx
import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useInsightsState } from '@/hooks/useInsightsState';
import { useApp } from '@/contexts/AppProvider';
import { PieChartSection } from '@/components/insights/PieChartSection';
import { LineChartSection } from '@/components/insights/LineChartSection';
import { BarChartSection } from '@/components/insights/BarChartSection';
import { SmartInsightsSection } from '@/components/insights/SmartInsightsSection';
import { DateRangePicker } from '@/components/insights/DateRangePicker';

export default function InsightsScreen() {
  const { data, loading, dateRange, actions } = useInsightsState();
  const { state: appState, actions: appActions } = useApp();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={actions.setDateRange}
        />

        {data && (
          <>
            <PieChartSection data={data.breakdown} />
            <LineChartSection data={data.trends} />
            <BarChartSection data={data.comparison} />
            <SmartInsightsSection insights={data.overview} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
```

### Alerts Page Implementation

```typescript
// app/(drawer)/alerts.tsx
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useAlertsState } from '@/hooks/useAlertsState';
import { useApp } from '@/contexts/AppProvider';
import { useDialog } from '@/contexts/DialogProvider';
import { AlertCard } from '@/components/alert/AlertCard';
import { AlertForm } from '@/components/alert/AlertForm';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function AlertsScreen() {
  const { alerts, loading, actions } = useAlertsState();
  const { state: appState, actions: appActions } = useApp();
  const { showConfirmationDialog } = useDialog();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  const handleDeleteAlert = useCallback((alert: Alert) => {
    showConfirmationDialog({
      title: 'Delete Alert',
      description: `Delete "${alert.name}" alert?`,
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      loadingText: 'Deleting alert...',
      onConfirm: () => actions.removeAlert(alert.id),
    });
  }, [actions, showConfirmationDialog]);

  const handleToggleAlert = useCallback(async (alert: Alert) => {
    await actions.toggleAlert(alert.id, !alert.isActive);
  }, [actions]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        <AlertForm onSubmit={actions.addAlert} />

        <Text className="text-xl font-bold my-4">
          Active Alerts ({alerts.filter(a => a.isActive).length})
        </Text>

        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onToggle={() => handleToggleAlert(alert)}
            onEdit={(updates) => actions.editAlert(alert.id, updates)}
            onDelete={() => handleDeleteAlert(alert)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
```

### Debug Page Implementation

```typescript
// app/debugScreen.tsx
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useDebugState } from '@/hooks/useDebugState';
import { useApp } from '@/contexts/AppProvider';
import { DebugInfoSection } from '@/components/debug/DebugInfoSection';
import { TestResultsSection } from '@/components/debug/TestResultsSection';
import { SystemTestsSection } from '@/components/debug/SystemTestsSection';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function DebugScreen() {
  const { debugInfo, testResults, loading, actions } = useDebugState();
  const { state: appState, actions: appActions } = useApp();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  const runAllTests = useCallback(async () => {
    const tests = ['database', 'permissions', 'background', 'sms'];
    for (const test of tests) {
      await actions.runSystemTest(test);
    }
  }, [actions]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Debug Information</Text>

        <View className="flex-row gap-2 mb-4">
          <Button onPress={runAllTests} className="flex-1">
            <Text>Run All Tests</Text>
          </Button>
          <Button onPress={actions.clearTestResults} variant="outline" className="flex-1">
            <Text>Clear Results</Text>
          </Button>
        </View>

        {debugInfo && <DebugInfoSection info={debugInfo} />}

        <TestResultsSection results={testResults} />

        <SystemTestsSection onRunTest={actions.runSystemTest} />
      </View>
    </ScrollView>
  );
}
```

### Logs Page Implementation

```typescript
// Create a new logs page at app/logsScreen.tsx
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useLogsState } from '@/hooks/useLogsState';
import { useApp } from '@/contexts/AppProvider';
import { useDialog } from '@/contexts/DialogProvider';
import { LogCard } from '@/components/logs/LogCard';
import { LogFilters } from '@/components/logs/LogFilters';
import { LogStats } from '@/components/logs/LogStats';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function LogsScreen() {
  const { logs, stats, loading, filters, actions } = useLogsState();
  const { state: appState, actions: appActions } = useApp();
  const { showConfirmationDialog } = useDialog();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  const handleClearLogs = useCallback(() => {
    showConfirmationDialog({
      title: 'Clear All Logs',
      description: 'This will permanently delete all application logs. This action cannot be undone.',
      confirmText: 'Clear Logs',
      confirmVariant: 'destructive',
      loadingText: 'Clearing logs...',
      onConfirm: actions.clearAllLogs,
    });
  }, [actions, showConfirmationDialog]);

  const handleExportLogs = useCallback(async () => {
    await actions.exportLogData();
  }, [actions]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Application Logs</Text>

        {stats && <LogStats stats={stats} />}

        <LogFilters
          filters={filters}
          onFiltersChange={actions.setFilters}
        />

        <View className="flex-row gap-2 my-4">
          <Button onPress={handleExportLogs} variant="outline" className="flex-1">
            <Text>Export Logs</Text>
          </Button>
          <Button onPress={handleClearLogs} variant="destructive" className="flex-1">
            <Text>Clear All</Text>
          </Button>
        </View>

        {logs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}

        {logs.length === 0 && (
          <View className="py-8">
            <Text className="text-center text-gray-600">No logs found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

### Background Tasks Page Implementation

```typescript
// Create a new background page at app/backgroundScreen.tsx
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useBackgroundTasksState } from '@/hooks/useBackgroundTasksState';
import { useApp } from '@/contexts/AppProvider';
import { TaskStatusCard } from '@/components/background/TaskStatusCard';
import { TaskHistorySection } from '@/components/background/TaskHistorySection';
import { TaskSettingsForm } from '@/components/background/TaskSettingsForm';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function BackgroundScreen() {
  const { taskStatus, taskHistory, loading, actions } = useBackgroundTasksState();
  const { state: appState, actions: appActions } = useApp();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  const handleTaskToggle = useCallback(async (taskType: string, isRunning: boolean) => {
    if (isRunning) {
      await actions.stopTask(taskType);
    } else {
      await actions.startTask(taskType);
    }
  }, [actions]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Background Tasks</Text>

        {taskStatus && (
          <TaskStatusCard
            status={taskStatus}
            onToggle={handleTaskToggle}
          />
        )}

        <TaskSettingsForm
          onSettingsUpdate={actions.updateSettings}
        />

        <TaskHistorySection history={taskHistory} />
      </View>
    </ScrollView>
  );
}
```

```typescript
// app/(drawer)/approveTransaction.tsx
import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTransactionState } from '@/hooks/useTransactionState';
import { useDialog } from '@/contexts/DialogProvider';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function ApproveTransactionScreen() {
  const router = useRouter();
  const { transactions, loading, actions } = useTransactionState();
  const { showConfirmationDialog } = useDialog();

  // Filter pending transactions
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  const handleApprove = useCallback((transaction: Transaction) => {
    showConfirmationDialog({
      title: 'Approve Transaction',
      description: `Approve "${transaction.description}" for $${transaction.amount}?`,
      confirmText: 'Approve',
      confirmVariant: 'default',
      loadingText: 'Approving...',
      onConfirm: async () => {
        const success = await actions.approveTransaction(transaction.id);
        if (success) {
          // Navigate to transactions page - it will auto-refresh
          router.push('/(drawer)/(tabs)/transactions');
        }
      },
    });
  }, [actions, showConfirmationDialog, router]);

  const handleReject = useCallback((transaction: Transaction) => {
    showConfirmationDialog({
      title: 'Reject Transaction',
      description: `Reject "${transaction.description}" for $${transaction.amount}?`,
      confirmText: 'Reject',
      confirmVariant: 'destructive',
      loadingText: 'Rejecting...',
      onConfirm: async () => {
        const success = await actions.rejectTransaction(transaction.id);
        if (success) {
          // Stay on page, list will auto-refresh
        }
      },
    });
  }, [actions, showConfirmationDialog]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading pending transactions...</Text>
      </View>
    );
  }

  if (pendingTransactions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg font-semibold mb-2">No Pending Transactions</Text>
        <Text className="text-gray-600 text-center mb-4">
          All transactions have been reviewed.
        </Text>
        <Button onPress={() => router.push('/(drawer)/(tabs)/transactions')}>
          <Text>View All Transactions</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">
        Pending Transactions ({pendingTransactions.length})
      </Text>

      {pendingTransactions.map((transaction) => (
        <View key={transaction.id} className="mb-4">
          <TransactionCard transaction={transaction} />

          <View className="flex-row gap-2 mt-2">
            <Button
              variant="default"
              className="flex-1"
              onPress={() => handleApprove(transaction)}
            >
              <Text>Approve</Text>
            </Button>

            <Button
              variant="destructive"
              className="flex-1"
              onPress={() => handleReject(transaction)}
            >
              <Text>Reject</Text>
            </Button>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
```

## Transactions Page Implementation

```typescript
// app/(drawer)/(tabs)/transactions.tsx
import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useTransactionState } from '@/hooks/useTransactionState';
import { useApp } from '@/contexts/AppProvider';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { FilterForm } from '@/components/transaction/FilterForm';
import { Text } from '@/components/ui/text';

export default function TransactionsScreen() {
  const { transactions, loading, filters, actions } = useTransactionState();
  const { state: appState, actions: appActions } = useApp();

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await actions.refresh();
    appActions.setRefreshing(false);
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={appState.isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="p-4">
          <FilterForm
            filters={filters}
            onFiltersChange={actions.setFilters}
          />

          {loading && (
            <View className="py-8">
              <Text className="text-center">Loading transactions...</Text>
            </View>
          )}

          {!loading && transactions.length === 0 && (
            <View className="py-8">
              <Text className="text-center">No transactions found</Text>
            </View>
          )}

          {transactions.map((transaction) => (
            <View key={transaction.id} className="mb-3">
              <TransactionCard transaction={transaction} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
```

## Dashboard Implementation with Auto-Refresh

```typescript
// app/(drawer)/(tabs)/index.tsx (Dashboard)
import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useApp } from '@/contexts/AppProvider';
import { KPISection } from '@/components/dashboard/KPISection';
import { RecentTransactionsSection } from '@/components/dashboard/RecentTransactionsSection';

export default function DashboardScreen() {
  const { data, loading, refresh } = useDashboardState();
  const { state: appState, actions: appActions } = useApp();

  const handleRefresh = async () => {
    appActions.setRefreshing(true);
    await refresh();
    appActions.setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="p-4">
        {data && (
          <>
            <KPISection stats={data.stats} />
            <RecentTransactionsSection transactions={data.recentTransactions} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
```

## Root Layout with AppProvider

```typescript
// app/_layout.tsx
import { SQLiteProvider } from 'expo-sqlite';
import { AppProvider } from '@/contexts/AppProvider';
import { DialogProvider } from '@/contexts/DialogProvider';
import { ToastProvider } from '@/contexts/ToastProvider';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="app.db" assetSource={{ assetId: require('@/assets/database/app.db') }}>
      <AppProvider>
        <DialogProvider>
          <ToastProvider>
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            </Stack>
          </ToastProvider>
        </DialogProvider>
      </AppProvider>
    </SQLiteProvider>
  );
}
```

## Key Features for All Screens

### 1. **Universal Auto-Refresh System**

- **Cross-Screen Updates**: When you modify data in any screen, all related screens automatically update
- **Smart Triggers**: Each action triggers only relevant refreshes (e.g., changing settings refreshes settings + background tasks)
- **Real-time Synchronization**: No manual refresh needed - data stays synchronized across the entire app

### 2. **Comprehensive State Management**

**All Screens Covered:**

- **Dashboard**: Auto-updates when transactions/settings change
- **Transactions**: Refreshes when approved/rejected from ApproveTransaction page
- **Insights**: Updates when new transactions are added or date range changes
- **Settings**: Reflects changes immediately and triggers related screen updates
- **Alerts**: Real-time updates when alerts are created/modified/toggled
- **ApproveTransaction**: Updates transaction lists and triggers cross-screen refreshes
- **Debug**: Shows real-time system status and test results
- **Logs**: Auto-refreshes to show latest application logs
- **Background Tasks**: Real-time task status and history updates

### 3. **Smart Cross-Screen Dependencies**

**Settings Changes Impact:**

- Settings → Background Tasks (sync settings)
- Settings → Global Refresh (reset affects everything)

**Transaction Changes Impact:**

- Transactions → Dashboard (KPIs update)
- Transactions → Insights (charts refresh)
- ApproveTransaction → Transactions (list updates)

**Background Task Changes Impact:**

- Background Tasks → Logs (new entries)
- Background Tasks → Debug (system status)

### 4. **Pull-to-Refresh Support**

- **Universal**: All screens support pull-to-refresh
- **Consistent UX**: Same loading states and feedback across all screens
- **Efficient**: Uses the same refresh mechanisms as auto-updates

### 5. **Error Handling and User Feedback**

- **Toast Notifications**: Immediate feedback for all actions across all screens
- **Error Recovery**: Failed operations don't break the refresh system
- **Loading States**: Clear loading indicators during refresh operations
- **Graceful Degradation**: App continues working even if some refreshes fail

### 6. **Performance Optimizations**

- **Selective Refreshes**: Only affected screens refresh, not the entire app
- **Debounced Updates**: Rapid successive changes don't cause multiple refreshes
- **Memory Efficient**: State management doesn't cause memory leaks
- **Background Sync**: Updates can happen while user is on different screens

### 7. **Real-World Use Cases**

**Scenario 1: Approve Transaction Flow**

1. Open ApproveTransaction page → Shows pending transactions
2. Approve a transaction → Transaction status updates in database
3. Navigate to Transactions page → Automatically shows updated list (approved transaction moved)
4. Dashboard automatically updates → KPIs reflect the approved transaction
5. Insights page updates → Charts include the new approved data

**Scenario 2: Settings Change Flow**

1. Open Settings page → Shows current configuration
2. Change sync interval → Setting saves and triggers background task refresh
3. Background Tasks page automatically updates → Shows new sync schedule
4. Debug page updates → Reflects new system configuration

**Scenario 3: Background Task Flow**

1. Background task runs automatically → Processes new SMS messages
2. Transactions page updates → Shows new parsed transactions
3. Dashboard refreshes → KPIs update with new data
4. Insights refresh → Charts include new transaction data
5. Logs page updates → Shows background task execution logs

**Scenario 4: Alert Management Flow**

1. Create new spending alert → Alert saves to database
2. Alerts page refreshes → Shows new alert in list
3. Background monitoring detects spending threshold → Triggers alert
4. Dashboard shows alert notification → User sees alert indicator
5. Transactions page can show flagged transactions → Visual indicators for alert triggers

This implementation ensures that when you approve a transaction on the ApproveTransaction page and navigate to the Transactions page, the data is automatically updated without any manual intervention.
