import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// App State Interface - Lightweight trigger system
interface AppState {
  // Specific lightweight triggers for different app sections
  kpiUpdateTrigger: number;
  recentTransactionsTrigger: number;
  pendingTransactionCountTrigger: number;
  transactionListTrigger: number;
  dashboardUpdateTrigger: number;
  settingsUpdateTrigger: number;
  insightsUpdateTrigger: number;
  alertsUpdateTrigger: number;
  notificationsUpdateTrigger: number;

  // Global loading state
  isRefreshing: boolean;

  // Last update timestamps for debugging and optimization
  lastKpiUpdate: string | null;
  lastRecentTransactionsUpdate: string | null;
  lastPendingCountUpdate: string | null;
  lastTransactionListUpdate: string | null;
  lastDashboardUpdate: string | null;
  lastSettingsUpdate: string | null;
  lastInsightsUpdate: string | null;
  lastAlertsUpdate: string | null;
  lastNotificationsUpdate: string | null;
}

// App Actions Interface - All triggers are debounced for performance
interface AppActions {
  // Individual trigger functions (debounced)
  triggerKpiUpdate: () => void;
  triggerRecentTransactionsUpdate: () => void;
  triggerPendingTransactionCountUpdate: () => void;
  triggerTransactionListUpdate: () => void;
  triggerSettingsRefresh: () => void;
  triggerInsightsRefresh: () => void;
  triggerAlertsRefresh: () => void;
  triggerNotificationsRefresh: () => void;
  triggerGlobalRefresh: () => void;

  // Combined triggers for efficiency (debounced)
  triggerTransactionDataUpdate: () => void; // Updates KPI + Recent + Pending + List + Alerts
  triggerDashboardDataUpdate: () => void; // Updates Dashboard + KPI + Recent + Notifications

  // Loading state management
  setRefreshing: (loading: boolean) => void;

  // Timestamp markers (non-triggering, for optimization)
  markKpiUpdated: () => void;
  markRecentTransactionsUpdated: () => void;
  markPendingCountUpdated: () => void;
  markTransactionListUpdated: () => void;
  markSettingsUpdated: () => void;
  markInsightsUpdated: () => void;
  markAlertsUpdated: () => void;
  markNotificationsUpdated: () => void;
}

// App Context Type
interface AppContextType {
  state: AppState;
  actions: AppActions;
}

// Create Context
const AppContext = createContext<AppContextType | null>(null);

// Initial State
const initialState: AppState = {
  kpiUpdateTrigger: 0,
  recentTransactionsTrigger: 0,
  pendingTransactionCountTrigger: 0,
  transactionListTrigger: 0,
  dashboardUpdateTrigger: 0,
  settingsUpdateTrigger: 0,
  insightsUpdateTrigger: 0,
  alertsUpdateTrigger: 0,
  notificationsUpdateTrigger: 0,
  isRefreshing: false,
  lastKpiUpdate: null,
  lastRecentTransactionsUpdate: null,
  lastPendingCountUpdate: null,
  lastTransactionListUpdate: null,
  lastDashboardUpdate: null,
  lastSettingsUpdate: null,
  lastInsightsUpdate: null,
  lastAlertsUpdate: null,
  lastNotificationsUpdate: null,
};

// App State Provider Component - Manages global app state with lightweight triggers
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Debounce refs to prevent excessive triggers (performance optimization)
  const debounceRefs = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  // Debounced trigger helper
  const debouncedTrigger = useCallback((key: string, updateFn: () => void, delay = 50) => {
    // Clear existing timeout
    if (debounceRefs.current[key]) {
      clearTimeout(debounceRefs.current[key]);
    }

    // Set new timeout
    debounceRefs.current[key] = setTimeout(() => {
      updateFn();
      delete debounceRefs.current[key];
    }, delay);
  }, []);

  // KPI update trigger (debounced)
  const triggerKpiUpdate = useCallback(() => {
    debouncedTrigger('kpi', () => {
      setState((prev) => ({
        ...prev,
        kpiUpdateTrigger: prev.kpiUpdateTrigger + 1,
        lastKpiUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Recent transactions update trigger (debounced)
  const triggerRecentTransactionsUpdate = useCallback(() => {
    debouncedTrigger('recentTransactions', () => {
      setState((prev) => ({
        ...prev,
        recentTransactionsTrigger: prev.recentTransactionsTrigger + 1,
        lastRecentTransactionsUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Pending transaction count update trigger (debounced)
  const triggerPendingTransactionCountUpdate = useCallback(() => {
    debouncedTrigger('pendingCount', () => {
      setState((prev) => ({
        ...prev,
        pendingTransactionCountTrigger: prev.pendingTransactionCountTrigger + 1,
        lastPendingCountUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Transaction list update trigger (debounced)
  const triggerTransactionListUpdate = useCallback(() => {
    debouncedTrigger('transactionList', () => {
      setState((prev) => ({
        ...prev,
        transactionListTrigger: prev.transactionListTrigger + 1,
        lastTransactionListUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Settings refresh trigger (debounced)
  const triggerSettingsRefresh = useCallback(() => {
    debouncedTrigger('settings', () => {
      setState((prev) => ({
        ...prev,
        settingsUpdateTrigger: prev.settingsUpdateTrigger + 1,
        lastSettingsUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Insights refresh trigger (debounced)
  const triggerInsightsRefresh = useCallback(() => {
    debouncedTrigger('insights', () => {
      setState((prev) => ({
        ...prev,
        insightsUpdateTrigger: prev.insightsUpdateTrigger + 1,
        lastInsightsUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Alerts refresh trigger (debounced)
  const triggerAlertsRefresh = useCallback(() => {
    debouncedTrigger('alerts', () => {
      setState((prev) => ({
        ...prev,
        alertsUpdateTrigger: prev.alertsUpdateTrigger + 1,
        lastAlertsUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Notifications refresh trigger (debounced)
  const triggerNotificationsRefresh = useCallback(() => {
    debouncedTrigger('notifications', () => {
      setState((prev) => ({
        ...prev,
        notificationsUpdateTrigger: prev.notificationsUpdateTrigger + 1,
        lastNotificationsUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Combined trigger for all transaction-related data (debounced)
  // Updates: KPI, Recent Transactions, Pending Count, Transaction List, Alerts
  const triggerTransactionDataUpdate = useCallback(() => {
    debouncedTrigger('transactionData', () => {
      const timestamp = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        kpiUpdateTrigger: prev.kpiUpdateTrigger + 1,
        recentTransactionsTrigger: prev.recentTransactionsTrigger + 1,
        pendingTransactionCountTrigger: prev.pendingTransactionCountTrigger + 1,
        transactionListTrigger: prev.transactionListTrigger + 1,
        alertsUpdateTrigger: prev.alertsUpdateTrigger + 1,
        lastKpiUpdate: timestamp,
        lastRecentTransactionsUpdate: timestamp,
        lastPendingCountUpdate: timestamp,
        lastTransactionListUpdate: timestamp,
        lastAlertsUpdate: timestamp,
      }));
    });
  }, [debouncedTrigger]);

  // Combined trigger for dashboard data (debounced)
  // Updates: Dashboard, KPI, Recent Transactions, Notifications
  const triggerDashboardDataUpdate = useCallback(() => {
    debouncedTrigger('dashboardData', () => {
      const timestamp = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        dashboardUpdateTrigger: prev.dashboardUpdateTrigger + 1,
        kpiUpdateTrigger: prev.kpiUpdateTrigger + 1,
        recentTransactionsTrigger: prev.recentTransactionsTrigger + 1,
        notificationsUpdateTrigger: prev.notificationsUpdateTrigger + 1,
        lastDashboardUpdate: timestamp,
        lastKpiUpdate: timestamp,
        lastRecentTransactionsUpdate: timestamp,
        lastNotificationsUpdate: timestamp,
      }));
    });
  }, [debouncedTrigger]);

  // Global refresh trigger - Updates all triggers immediately
  // Use sparingly - prefer specific or combined triggers for better performance
  const triggerGlobalRefresh = useCallback(() => {
    const timestamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      kpiUpdateTrigger: prev.kpiUpdateTrigger + 1,
      recentTransactionsTrigger: prev.recentTransactionsTrigger + 1,
      pendingTransactionCountTrigger: prev.pendingTransactionCountTrigger + 1,
      transactionListTrigger: prev.transactionListTrigger + 1,
      dashboardUpdateTrigger: prev.dashboardUpdateTrigger + 1,
      settingsUpdateTrigger: prev.settingsUpdateTrigger + 1,
      insightsUpdateTrigger: prev.insightsUpdateTrigger + 1,
      alertsUpdateTrigger: prev.alertsUpdateTrigger + 1,
      notificationsUpdateTrigger: prev.notificationsUpdateTrigger + 1,
      lastKpiUpdate: timestamp,
      lastRecentTransactionsUpdate: timestamp,
      lastPendingCountUpdate: timestamp,
      lastTransactionListUpdate: timestamp,
      lastDashboardUpdate: timestamp,
      lastSettingsUpdate: timestamp,
      lastInsightsUpdate: timestamp,
      lastAlertsUpdate: timestamp,
      lastNotificationsUpdate: timestamp,
    }));
  }, []);

  // Set refreshing state
  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setState((prev) => ({ ...prev, isRefreshing }));
  }, []);

  // Optimized mark update functions
  const markKpiUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastKpiUpdate: new Date().toISOString(),
    }));
  }, []);

  const markRecentTransactionsUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastRecentTransactionsUpdate: new Date().toISOString(),
    }));
  }, []);

  const markPendingCountUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastPendingCountUpdate: new Date().toISOString(),
    }));
  }, []);

  const markTransactionListUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastTransactionListUpdate: new Date().toISOString(),
    }));
  }, []);

  const markSettingsUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastSettingsUpdate: new Date().toISOString(),
    }));
  }, []);

  const markInsightsUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastInsightsUpdate: new Date().toISOString(),
    }));
  }, []);

  const markAlertsUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastAlertsUpdate: new Date().toISOString(),
    }));
  }, []);

  const markNotificationsUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastNotificationsUpdate: new Date().toISOString(),
    }));
  }, []);

  // Create actions object
  const actions: AppActions = {
    triggerKpiUpdate,
    triggerRecentTransactionsUpdate,
    triggerPendingTransactionCountUpdate,
    triggerTransactionListUpdate,
    triggerSettingsRefresh,
    triggerInsightsRefresh,
    triggerAlertsRefresh,
    triggerNotificationsRefresh,
    triggerGlobalRefresh,
    triggerTransactionDataUpdate,
    triggerDashboardDataUpdate,
    setRefreshing,
    markKpiUpdated,
    markRecentTransactionsUpdated,
    markPendingCountUpdated,
    markTransactionListUpdated,
    markSettingsUpdated,
    markInsightsUpdated,
    markAlertsUpdated,
    markNotificationsUpdated,
  };

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>;
};

// Custom hook to use app context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppStateProvider');
  }
  return context;
};

// Export for convenience
export default AppProvider;
