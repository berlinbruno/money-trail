import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// App State Interface
interface AppState {
  // Simplified refresh triggers - only what we actually need
  transactionUpdateTrigger: number;
  dashboardUpdateTrigger: number;
  settingsUpdateTrigger: number;
  insightsUpdateTrigger: number;

  // Loading states
  isRefreshing: boolean;

  // Last update timestamps (simplified)
  lastTransactionUpdate: string | null;
  lastDashboardUpdate: string | null;
  lastSettingsUpdate: string | null;
  lastInsightsUpdate: string | null;
}

// App Actions Interface
interface AppActions {
  // Core refresh triggers (debounced)
  triggerTransactionRefresh: () => void;
  triggerDashboardRefresh: () => void;
  triggerSettingsRefresh: () => void;
  triggerInsightsRefresh: () => void;
  triggerGlobalRefresh: () => void;

  // Loading state
  setRefreshing: (loading: boolean) => void;

  // Mark updates (for timestamp tracking)
  markTransactionUpdated: () => void;
  markDashboardUpdated: () => void;
  markSettingsUpdated: () => void;
  markInsightsUpdated: () => void;
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
  transactionUpdateTrigger: 0,
  dashboardUpdateTrigger: 0,
  settingsUpdateTrigger: 0,
  insightsUpdateTrigger: 0,
  isRefreshing: false,
  lastTransactionUpdate: null,
  lastDashboardUpdate: null,
  lastSettingsUpdate: null,
  lastInsightsUpdate: null,
};

// App State Provider Component
export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Debounce refs to prevent excessive triggers
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

  // Transaction refresh trigger (debounced)
  const triggerTransactionRefresh = useCallback(() => {
    debouncedTrigger('transaction', () => {
      setState((prev) => ({
        ...prev,
        transactionUpdateTrigger: prev.transactionUpdateTrigger + 1,
        dashboardUpdateTrigger: prev.dashboardUpdateTrigger + 1, // Dashboard depends on transactions
        lastTransactionUpdate: new Date().toISOString(),
      }));
    });
  }, [debouncedTrigger]);

  // Dashboard refresh trigger (debounced)
  const triggerDashboardRefresh = useCallback(() => {
    debouncedTrigger('dashboard', () => {
      setState((prev) => ({
        ...prev,
        dashboardUpdateTrigger: prev.dashboardUpdateTrigger + 1,
        lastDashboardUpdate: new Date().toISOString(),
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

  // Global refresh trigger (immediate, but still debounced per category)
  const triggerGlobalRefresh = useCallback(() => {
    const timestamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      transactionUpdateTrigger: prev.transactionUpdateTrigger + 1,
      dashboardUpdateTrigger: prev.dashboardUpdateTrigger + 1,
      settingsUpdateTrigger: prev.settingsUpdateTrigger + 1,
      insightsUpdateTrigger: prev.insightsUpdateTrigger + 1,
      lastTransactionUpdate: timestamp,
      lastDashboardUpdate: timestamp,
      lastSettingsUpdate: timestamp,
      lastInsightsUpdate: timestamp,
    }));
  }, []);

  // Set refreshing state
  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setState((prev) => ({ ...prev, isRefreshing }));
  }, []);

  // Optimized mark update functions
  const markTransactionUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastTransactionUpdate: new Date().toISOString(),
    }));
  }, []);

  const markDashboardUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastDashboardUpdate: new Date().toISOString(),
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

  // Create actions object
  const actions: AppActions = {
    triggerTransactionRefresh,
    triggerDashboardRefresh,
    triggerSettingsRefresh,
    triggerInsightsRefresh,
    triggerGlobalRefresh,
    setRefreshing,
    markTransactionUpdated,
    markDashboardUpdated,
    markSettingsUpdated,
    markInsightsUpdated,
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
export default AppStateProvider;
