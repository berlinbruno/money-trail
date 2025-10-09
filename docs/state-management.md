# State Management System - Money Trail

## Overview

The Money Trail app uses a lightweight, trigger-based state management system centered around **AppContext** for cross-screen synchronization and the **useTransaction** hook for transaction operations. This system ensures real-time data consistency across all screens without heavy state management overhead.

## Architecture Components

### 1. AppContext (`contexts/AppContext.tsx`)

**Purpose**: Central state management with lightweight triggers for cross-screen updates

**Key Features**:

- **Debounced Triggers**: Prevent excessive re-renders with 50ms debouncing
- **Specific Triggers**: Individual triggers for KPI, transactions, dashboard, etc.
- **Combined Triggers**: Efficient batch updates (e.g., `triggerTransactionDataUpdate()`)
- **Global Loading State**: Unified refresh state across all screens
- **Timestamp Tracking**: Optimization and debugging support

**Core Triggers**:

```typescript
interface AppState {
  // Individual triggers
  kpiUpdateTrigger: number;
  recentTransactionsTrigger: number;
  pendingTransactionCountTrigger: number;
  transactionListTrigger: number;
  dashboardUpdateTrigger: number;
  settingsUpdateTrigger: number;
  insightsUpdateTrigger: number;
  alertsUpdateTrigger: number;
  notificationsUpdateTrigger: number;

  // Global state
  isRefreshing: boolean;
}
```

**Key Actions**:

```typescript
interface AppActions {
  // Individual triggers (debounced)
  triggerKpiUpdate: () => void;
  triggerRecentTransactionsUpdate: () => void;
  triggerPendingTransactionCountUpdate: () => void;
  triggerTransactionListUpdate: () => void;

  // Combined triggers for efficiency
  triggerTransactionDataUpdate: () => void; // Updates KPI + Recent + Pending + List + Alerts
  triggerDashboardDataUpdate: () => void; // Updates Dashboard + KPI + Recent + Notifications

  // Global state
  setRefreshing: (loading: boolean) => void;

  // Timestamp markers (non-triggering)
  markKpiUpdated: () => void;
  markTransactionListUpdated: () => void;
}
```

### 2. useTransaction Hook (`hooks/useTransaction.ts`)

**Purpose**: Lightweight transaction operations with automatic cross-screen updates

**Design Philosophy**:

- **Action-focused**: Provides operations, not state management
- **Automatic Triggers**: All operations trigger relevant app-wide updates
- **Optimistic Updates**: Helper for immediate UI feedback
- **Toast Integration**: Built-in user feedback

**Core Operations**:

```typescript
export const useTransaction = () => {
  // Database operations with automatic triggers
  const approveTransaction = async (transactionId: string): Promise<boolean>
  const approveAllTransactions = async (): Promise<boolean>
  const removeTransaction = async (transactionId: string): Promise<boolean>

  // Optimistic UI update helper
  const updateTransactionState = (
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[] | null>>,
    operation: 'approve' | 'approve_all' | 'delete',
    transactionId?: string
  ) => void
}
```

### 3. Hook System Architecture

The Money Trail app uses a comprehensive hook system that provides specialized functionality for different aspects of the application:

#### 3.1 useTransaction Hook (`hooks/useTransaction.ts`)

**Purpose**: Core transaction operations with automatic cross-screen synchronization

**Design Philosophy**:

- **Action-focused**: Provides operations, not state management
- **Automatic Triggers**: All operations trigger relevant app-wide updates
- **Built-in Feedback**: Toast notifications and error handling included

**Core Operations**:

```typescript
export const useTransaction = () => {
  // CRUD operations
  const createTransaction: (transaction: NewTransaction) => Promise<boolean>;
  const updateTransaction: (transaction: EditTransaction) => Promise<boolean>;
  const deleteTransaction: (transactionId: string) => Promise<boolean>;

  // Approval operations
  const approveTransaction: (transactionId: string) => Promise<boolean>;
  const approveAllTransactions: () => Promise<boolean>;
  const toggleTransactionApproval: (id: string, status: 0 | 1) => Promise<boolean>;

  // Query operations
  const fetchTransactions: (filters: FilterOptions) => Promise<Transaction[]>;
  const getPendingCount: () => Promise<number>;
  const searchTransactions: (searchText: string) => Promise<Transaction[]>;

  // Bulk operations
  const bulkApproveTransactions: (ids: string[]) => Promise<boolean>;
  const bulkDeleteTransactions: (ids: string[]) => Promise<boolean>;

  // Utility operations
  const duplicateTransaction: (transactionId: string) => Promise<boolean>;
  const updateTransactionState: (setState, operation, id?) => void; // Optimistic updates
};
```

#### 3.2 useInsightManager Hook (`hooks/useInsightManager.ts`)

**Purpose**: Comprehensive insights data management with optimized performance

**Design Philosophy**:

- **Centralized Management**: Single hook for all insights operations and state
- **Performance Optimized**: Prevents dashboard re-renders through careful dependency management
- **Selective Updates**: Minimizes unnecessary re-renders across screens
- **Auto-refresh Support**: Responds to transaction data changes automatically

**Core Features**:

```typescript
export const useInsightManager = ({
  autoRefresh = true,
  initialRangeIndex = 0,
}: InsightManagerOptions = {}) => {
  // State management
  const selectedRangeIndex: number;
  const currentRangeKey: keyof insightsDataset;
  const insightsData: InsightsData;
  const isLoading: boolean;

  // Derived state
  const hasInsightsData: boolean;
  const hasTimeSeriesData: boolean;

  // Operations
  const fetchInsightsData: (showLoading?: boolean) => Promise<void>;
  const handleRangeChange: (newIndex: number) => void;
  const handleRefresh: () => Promise<void>;
  const resetInsightsData: () => void;

  // Minimal app state exposure
  const appState: { isRefreshing: boolean };
};
```

**Key Optimizations**:

- **Dependency Cycle Prevention**: Carefully managed `useEffect` dependencies to prevent dashboard re-renders
- **Stabilized Callbacks**: Functions are memoized to prevent unnecessary recreations
- **Minimal App State**: Only exposes `isRefreshing` to prevent excessive subscriptions
- **Silent Refreshes**: Background data fetching without loading indicators for automatic updates

#### 3.3 useTransactionManager Hook (`hooks/useTransactionManager.ts`)

**Purpose**: Complete transaction screen management with UI state and operations

**Design Philosophy**:

- **UI Integration**: Manages both data and UI state for transaction screens
- **Filter Management**: Comprehensive filtering, sorting, and search capabilities
- **Modal Coordination**: Handles all modal states and interactions
- **Optimistic Updates**: Immediate UI feedback with error recovery

**Core Features**:

```typescript
export const useTransactionManager = ({
  flaggedOnly = false,
  initialPreset = 'All',
}: TransactionManagerOptions = {}) => {
  // Main state
  const transactions: Transaction[] | null;
  const isRefreshing: boolean;
  const sortOrder: 'asc' | 'desc';
  const sortBy: 'date' | 'amount';
  const filterState: FilterState;

  // Modal states
  const showFilterModal: boolean;
  const showSortModal: boolean;
  const showTransactionModal: boolean;
  const selectedTransaction: Transaction | undefined;

  // Operations
  const applyDatePreset: (preset: string) => void;
  const handleFetchTransactions: (showLoader?: boolean) => Promise<void>;
  const handleEditTransaction: (id: string) => void;
  const handleDeleteTransaction: (id: string) => void;
  const handleApproveTransaction: (id: string) => void;
  const handleApproveAllTransactions: () => void;
  const handleAddTransaction: () => void;
  const handleCloseTransactionModal: () => void;
};
```

#### 3.4 useAlertManager Hook (`hooks/useAlertManager.ts`)

**Purpose**: Complete alert system management with progress tracking

**Design Philosophy**:

- **Category Grouping**: Organizes alerts by type and frequency
- **Progress Tracking**: Real-time progress calculation with current values
- **CRUD Operations**: Full alert lifecycle management
- **UI State Management**: Modal and expansion state coordination

**Core Features**:

```typescript
export const useAlertManager = ({ autoRefresh = true }: AlertManagerOptions = {}) => {
  // State
  const alertsGroupedByCategory: Record<string, Alerts[]>;
  const expandedCategoryKey: string | null;
  const modalVisible: boolean;
  const isFormSubmitting: boolean;

  // Modal form state
  const availableAlertCategories: TransactionCategory[] | undefined;
  const currentAlertTypeFrequency: { type: AlertType; frequency: AlertFrequency } | undefined;
  const selectedAlert: Alerts | undefined;

  // Derived data
  const spendingUsageRatio: number;
  const incomeUsageRatio: number;

  // Operations
  const loadAlerts: (showLoader?: boolean) => Promise<void>;
  const handleAddAlert: (categoryKey: string, categories: TransactionCategory[]) => void;
  const handleEditAlert: (alert: Alerts, categories: TransactionCategory[]) => void;
  const handleDeleteAlert: (alertId: string) => void;
  const handleSubmitAlert: (alert: NewAlert | EditAlert) => Promise<void>;

  // UI helpers
  const toggleCategoryExpansion: (key: string) => void;
  const closeModal: () => void;
  const handleRefresh: () => Promise<void>;
};
```

#### 3.5 useAppInitialization Hook (`hooks/useAppInitialization.ts`)

**Purpose**: Application startup sequence with permissions and initialization

**Design Philosophy**:

- **Sequential Initialization**: Handles app startup in correct order
- **Permission Management**: Manages SMS and background task permissions
- **Error Recovery**: Graceful handling of initialization failures
- **Conditional Features**: Disables features based on permission availability

**Core Features**:

```typescript
export const useAppInitialization = () => {
  const isInitialized: boolean;
  const isLoading: boolean;
  const error: string | null;
  const retry: () => Promise<void>;
};
```

**Initialization Sequence**:

1. **Database Setup**: Initialize tables and WAL mode
2. **Permission Requests**: SMS, background tasks, wake lock permissions
3. **Feature Configuration**: Enable/disable based on permissions
4. **Background Tasks**: Initialize SMS sync background processing
5. **Conditional SMS Sync**: Start initial sync if permissions allow
6. **Alert Notifications**: Initialize alert monitoring system

### 4. Conditional Rendering Pattern (Insights Components)

**Purpose**: Enhanced UX through dynamic component visibility based on data availability

**Design Philosophy**:

- **Data-Driven Visibility**: Components only render when meaningful data exists
- **Clean Interface**: No empty states or skeleton loaders cluttering the UI
- **Performance Benefits**: Reduced rendering overhead for empty visualizations
- **Consistent Behavior**: Uniform pattern across all insights components

**Implementation Pattern**:

```typescript
export default function InsightComponent({ data }: ComponentProps) {
  // 1. All React hooks first
  const processedData = useMemo(() => processData(data), [data]);
  const theme = useTheme();
  const { selectedCurrency } = useSettings();

  // 2. Data validation
  const hasData = useMemo(() => {
    // Check if component has meaningful data to display
    return Boolean(processedData && processedData.meaningfulValue > 0);
  }, [processedData]);

  // 3. Early return if no data (AFTER all hooks)
  if (!hasData) return null;

  // 4. Normal JSX rendering
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
      </CardHeader>
      <CardFooter>
        {/* Render meaningful content */}
      </CardFooter>
    </Card>
  );
}
```

**Components Using This Pattern**:

- **SmartInsightsSection**: Returns `null` when no financial insights exist
- **BarChartSection**: Hidden when `totalBarValue <= 0`
- **LineChartSection**: Hidden when no time series data for current period
- **PieChartSection**: Hidden when no category breakdown data exists

**Benefits**:

- **Cleaner UI**: Users only see sections with actual data
- **Better Performance**: No rendering of empty chart components
- **Improved UX**: No confusion from empty visualizations or skeleton states
- **Consistent Feel**: All insights components behave uniformly

### 4. Unified AppProvider (`contexts/AppProvider.tsx`)

**Purpose**: Single provider combining all context providers

```typescript
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppThemeProvider>
      <AppStateProvider>      {/* AppContext */}
        <DialogProvider>
          <ToastProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </ToastProvider>
        </DialogProvider>
      </AppStateProvider>
    </AppThemeProvider>
  );
}
```

```typescript
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppThemeProvider>
      <AppStateProvider>      {/* AppContext */}
        <DialogProvider>
          <ToastProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </ToastProvider>
        </DialogProvider>
      </AppStateProvider>
    </AppThemeProvider>
  );
}
```

### 5. Insights Hook Performance Pattern

**useInsightManager Implementation**:

The insights screen demonstrates advanced performance optimization techniques to prevent dashboard re-rendering cascades:

```typescript
function InsightsScreen() {
  // ✅ Centralized hook with optimized dependencies
  const {
    selectedRangeIndex,
    currentRangeKey,
    insightsData,
    handleRangeChange,
    handleRefresh,
    appState, // Only { isRefreshing } exposed
  } = useInsightManager();

  // ✅ Components handle their own conditional rendering
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={appState.isRefreshing} onRefresh={handleRefresh} />}>
      <BarChartSection timeSeriesData={insightsData.timeSeriesData} rangeLabel={currentRangeKey} />
      <LineChartSection timeSeriesData={insightsData.timeSeriesData} rangeLabel={currentRangeKey} />
      <PieChartSection categoryBreakdown={insightsData.categoryBreakdown} />
      <SmartInsightsSection insightsSummary={insightsData.insightsSummary} />
    </ScrollView>
  );
}
```

**Key Optimizations in useInsightManager**:

1. **Broken Dependency Cycles**: `fetchInsightsData` removed from `useEffect` dependencies
2. **Stabilized Callbacks**: Functions memoized to prevent unnecessary recreations
3. **Minimal App State**: Only exposes `isRefreshing`, not full app state
4. **Silent Refreshes**: Background updates without loading indicators
5. **Optimized useEffect**: Dependencies limited to triggers only, not callback functions

**Before vs After Performance**:

- **Before**: 140+ lines with complex state management, caused dashboard re-renders
- **After**: 53 lines (62% reduction), zero dashboard impact, cleaner separation of concerns

## Implementation Patterns

**Current Implementation** (Dashboard example):

```typescript
export default function DashboardScreen() {
  const { state: appState, actions: appActions } = useApp();
  const [localData, setLocalData] = useState(initialData);

  // Auto-refresh when triggers change
  useEffect(() => {
    const fetchData = async () => {
      const data = await getRecentTransactions(db, 5);
      setLocalData(data);
    };
    fetchData();
  }, [db, appState.recentTransactionsTrigger]);

  // Manual refresh handler
  const onRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchDashboardData(false);
    } finally {
      appActions.setRefreshing(false);
    }
  }, [appActions]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={onRefresh}
        />
      }>
      {/* Content */}
    </ScrollView>
  );
}
```

### 2. Transaction Operations Pattern

**Optimistic Updates with Fallback**:

```typescript
function TransactionListScreen() {
  const { removeTransaction, updateTransactionState } = useTransaction();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const handleDelete = useCallback(
    (id: string) => {
      showConfirmationDialog({
        title: 'Delete Transaction',
        description: 'Are you sure?',
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting...',
        onConfirm: async () => {
          try {
            // Optimistic update for immediate UI response
            updateTransactionState(setTransactions, 'delete', id);

            // Actual database operation
            await removeTransaction(id);

            showToast('Transaction deleted');
          } catch (err) {
            console.error('Failed to delete:', err);
            // Revert optimistic update on error
            await fetchTransactions(false);
            throw err; // Let dialog handle error state
          }
        },
      });
    },
    [removeTransaction, updateTransactionState, showConfirmationDialog]
  );
}
```

### 3. Cross-Screen Update Flow

#### Example: Approve Transaction Flow

```text
1. User approves transaction in ApproveTransaction screen
   ↓
2. useTransaction.approveTransaction() called
   ↓
3. Database updated + appActions.triggerTransactionDataUpdate()
   ↓
4. Multiple triggers fire simultaneously:
   - kpiUpdateTrigger (Dashboard KPIs refresh)
   - recentTransactionsTrigger (Dashboard recent list)
   - pendingTransactionCountTrigger (Badge counts)
   - transactionListTrigger (Transaction list screen)
   - alertsUpdateTrigger (Alert calculations)
   ↓
5. ALL screens automatically update in real-time
```

## Current Screen Implementations

### Dashboard Screen (`app/(drawer)/(tabs)/index.tsx`)

- ✅ Uses `useApp()` for triggers and global loading state
- ✅ Local state management with auto-refresh on triggers
- ✅ Manual refresh with `appActions.setRefreshing()`
- ✅ Responds to: `kpiUpdateTrigger`, `recentTransactionsTrigger`, `pendingTransactionCountTrigger`

### Transaction List Screen (`app/(drawer)/(tabs)/transactions.tsx`)

- ✅ Uses `useTransactionManager()` for comprehensive screen management
- ✅ Complete filter, sort, and search capabilities
- ✅ Modal state management for add/edit operations
- ✅ Optimistic updates with fallback recovery
- ✅ Responds to: `transactionListTrigger`

**Implementation Example**:

```typescript
export default function TransactionsScreen() {
  const {
    transactions,
    isRefreshing,
    filterState,
    showFilterModal,
    showTransactionModal,
    selectedTransaction,
    handleFetchTransactions,
    handleEditTransaction,
    handleDeleteTransaction,
    handleApproveTransaction,
    handleAddTransaction,
    handleCloseTransactionModal,
  } = useTransactionManager();

  return (
    <TransactionListView
      transactions={transactions}
      onRefresh={handleFetchTransactions}
      onEdit={handleEditTransaction}
      onDelete={handleDeleteTransaction}
      onApprove={handleApproveTransaction}
    />
  );
}
```

### Approve Transaction Screen (`app/(drawer)/approveTransaction.tsx`)

- ✅ Uses `useTransactionManager({ flaggedOnly: true })` for pending transactions
- ✅ Filters only pending transactions (flaggedOnly: true)
- ✅ Automatic cross-screen updates on operations
- ✅ Responds to: `transactionListTrigger`

### Insights Screen (`app/(drawer)/(tabs)/insights.tsx`)

- ✅ Uses `useInsightManager()` for comprehensive insights management
- ✅ Achieved 62% code reduction from 140+ lines to 53 lines
- ✅ Automatic refresh on transaction data changes
- ✅ Range selection with persistent state management
- ✅ Conditional rendering - components only render when data exists
- ✅ Responds to: `insightsUpdateTrigger`, `transactionListTrigger`

**Implementation Example**:

```typescript
export default function InsightsScreen() {
  const {
    selectedRangeIndex,
    currentRangeKey,
    insightsData,
    handleRangeChange,
    handleRefresh,
    appState,
  } = useInsightManager();

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={appState.isRefreshing} onRefresh={handleRefresh} />}>
      {/* Components render conditionally based on data availability */}
      <BarChartSection timeSeriesData={insightsData.timeSeriesData} rangeLabel={currentRangeKey} />
      <LineChartSection timeSeriesData={insightsData.timeSeriesData} rangeLabel={currentRangeKey} />
      <PieChartSection categoryBreakdown={insightsData.categoryBreakdown} />
      <SmartInsightsSection insightsSummary={insightsData.insightsSummary} />
    </ScrollView>
  );
}
```

### Alerts Screen (`app/(drawer)/alerts.tsx`)

- ✅ Uses `useAlertManager()` for comprehensive alert management
- ✅ Category-grouped alert display with progress tracking
- ✅ Complete CRUD operations with confirmation dialogs
- ✅ Real-time progress calculation and usage ratios
- ✅ Modal form management for add/edit operations
- ✅ Responds to: `alertsUpdateTrigger`, `transactionListTrigger`

**Implementation Example**:

```typescript
export default function AlertsScreen() {
  const {
    alertsGroupedByCategory,
    expandedCategoryKey,
    modalVisible,
    spendingUsageRatio,
    incomeUsageRatio,
    handleAddAlert,
    handleEditAlert,
    handleDeleteAlert,
    handleSubmitAlert,
    toggleCategoryExpansion,
    closeModal,
    handleRefresh,
    appState,
  } = useAlertManager();

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={appState.isRefreshing} onRefresh={handleRefresh} />}>
      <AlertProgressCard spendingUsage={spendingUsageRatio} incomeUsage={incomeUsageRatio} />
      {Object.entries(alertsGroupedByCategory).map(([categoryKey, alerts]) => (
        <AlertCategoryCard
          key={categoryKey}
          categoryKey={categoryKey}
          alerts={alerts}
          expanded={expandedCategoryKey === categoryKey}
          onToggleExpansion={toggleCategoryExpansion}
          onAddAlert={handleAddAlert}
          onEditAlert={handleEditAlert}
          onDeleteAlert={handleDeleteAlert}
        />
      ))}
    </ScrollView>
  );
}
```

### App Root (`app/_layout.tsx`)

- ✅ Uses `useAppInitialization()` for startup sequence
- ✅ Permission management and error handling
- ✅ Conditional feature enablement based on permissions
- ✅ Database initialization and background task setup

**Implementation Example**:

```typescript
export default function RootLayout() {
  const { isInitialized, isLoading, error, retry } = useAppInitialization();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={retry} />;
  }

  if (!isInitialized) {
    return <InitializationScreen />;
  }

  return <NavigationStack />;
}
```

### Settings, Background Task Screens

- ✅ Follow same pattern with specific triggers
- ✅ Auto-refresh when relevant data changes
- ✅ Unified loading states and error handling

## Key Benefits

### 🚀 **Performance Optimized**

- **Debounced Triggers**: Prevent excessive re-renders (50ms debounce)
- **Selective Updates**: Only affected components refresh
- **Lightweight Operations**: Action-focused hooks, not heavy state management
- **Optimistic Updates**: Immediate UI feedback with error recovery

### 🔄 **Real-Time Synchronization**

- **Cross-Screen Updates**: Approve transaction → Dashboard instantly updates
- **Automatic Refresh**: No manual refresh needed between screens
- **Consistent Data**: All screens show same data at all times
- **Background Updates**: SMS processing triggers updates across app

### 📱 **Developer Experience**

- **Simplified Patterns**: Consistent approach across all screens
- **Less Boilerplate**: No manual refresh logic needed
- **Type Safety**: Full TypeScript support throughout
- **Error Handling**: Built-in toast notifications and error recovery

### 🎯 **User Experience**

- **Instant Feedback**: Operations provide immediate visual feedback
- **Smooth Navigation**: No stale data between screen transitions
- **Pull-to-Refresh**: Unified refresh experience across all screens
- **Loading States**: Clear loading indicators with global coordination

## Common Usage Examples

### Basic Screen with Auto-Refresh

```typescript
function MyScreen() {
  const { state: appState, actions: appActions } = useApp();
  const [data, setData] = useState([]);

  // Auto-refresh when relevant trigger changes
  useEffect(() => {
    fetchData();
  }, [appState.relevantTrigger]);

  // Manual refresh
  const onRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchData();
    } finally {
      appActions.setRefreshing(false);
    }
  }, [appActions]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={onRefresh}
        />
      }>
      {/* Content */}
    </ScrollView>
  );
}
```

### Transaction Operation with Optimistic Update

```typescript
function TransactionActions() {
  const { approveTransaction, updateTransactionState } = useTransaction();
  const [transactions, setTransactions] = useState([]);

  const handleApprove = async (id: string) => {
    // Immediate UI update
    updateTransactionState(setTransactions, 'approve', id);

    // Database operation (auto-triggers cross-screen updates)
    const success = await approveTransaction(id);

    if (!success) {
      // Revert on error
      await fetchTransactions();
    }
  };
}
```

### Combined Trigger Usage

```typescript
function BulkOperations() {
  const { actions: appActions } = useApp();

  const handleBulkUpdate = async () => {
    // Perform multiple operations...
    await bulkUpdateTransactions();

    // Single efficient trigger for all related updates
    appActions.triggerTransactionDataUpdate();
    // This updates: KPI, Recent Transactions, Pending Count, Transaction List, Alerts
  };
}
```

## Migration Guide

### Replacing Heavy State Hooks

**Old Pattern** (Heavy individual state hooks):

```typescript
// ❌ Heavy, complex state management per screen
const { transactions, loading, actions } = useTransactionState();
const { insights, loading: insightsLoading } = useInsightsState();
const { alerts, loading: alertsLoading } = useAlertsState();
```

**New Pattern** (Lightweight specialized hooks):

```typescript
// ✅ Lightweight operations + specialized management
const { approveTransaction, removeTransaction } = useTransaction();
const { insightsData, handleRangeChange, handleRefresh } = useInsightManager();
const { alertsGroupedByCategory, handleAddAlert } = useAlertManager();
const [localState, setLocalState] = useState([]);
```

### Screen-Level Hook Integration

**Old Pattern** (Manual state management):

```typescript
// ❌ Manual state, effects, and UI management per screen
const [transactions, setTransactions] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [filterState, setFilterState] = useState({});
const [showModal, setShowModal] = useState(false);
const [selectedTransaction, setSelectedTransaction] = useState();

useEffect(() => {
  /* fetch data */
}, [filters]);
useEffect(() => {
  /* handle updates */
}, [triggers]);

const handleEdit = (id) => {
  /* manual modal management */
};
const handleDelete = (id) => {
  /* manual confirmation */
};
```

**New Pattern** (Comprehensive hook management):

```typescript
// ✅ Single hook managing all screen concerns
const {
  transactions,
  isRefreshing,
  filterState,
  showTransactionModal,
  selectedTransaction,
  handleEditTransaction,
  handleDeleteTransaction,
  handleApproveTransaction,
  handleFetchTransactions,
} = useTransactionManager({
  flaggedOnly: false,
  initialPreset: 'All',
});
```

### Insights Screen Modernization

**Old Pattern** (140+ lines with complex state):

```typescript
// ❌ Complex local state management, multiple useEffects
const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
const [insightsSummary, setInsightsSummary] = useState(null);
const [timeSeriesData, setTimeSeriesData] = useState(null);
const [categoryBreakdown, setCategoryBreakdown] = useState({ income: [], expense: [] });
const [isLoading, setIsLoading] = useState(false);

// Multiple useEffects causing re-render cascades
useEffect(() => {
  /* fetch insights */
}, [range]);
useEffect(() => {
  /* fetch categories */
}, [range]);
useEffect(() => {
  /* fetch time series */
}, [range]);
```

**New Pattern** (53 lines with centralized hook):

```typescript
// ✅ Single hook managing all insights state and operations
const {
  selectedRangeIndex,
  currentRangeKey,
  insightsData,
  handleRangeChange,
  handleRefresh,
  appState,
} = useInsightManager();
```

### Alert Management Modernization

**Old Pattern** (Manual alert state and operations):

```typescript
// ❌ Manual alert management with complex state
const [alerts, setAlerts] = useState([]);
const [expandedCategories, setExpandedCategories] = useState({});
const [modalVisible, setModalVisible] = useState(false);
const [formData, setFormData] = useState({});

const handleAddAlert = async (alert) => {
  /* manual CRUD */
};
const handleEditAlert = async (id, alert) => {
  /* manual update */
};
const handleDeleteAlert = async (id) => {
  /* manual deletion */
};
```

**New Pattern** (Comprehensive alert hook):

```typescript
// ✅ Centralized alert management with progress tracking
const {
  alertsGroupedByCategory,
  expandedCategoryKey,
  modalVisible,
  spendingUsageRatio,
  incomeUsageRatio,
  handleAddAlert,
  handleEditAlert,
  handleDeleteAlert,
  handleSubmitAlert,
  toggleCategoryExpansion,
} = useAlertManager();
```

### Component Conditional Rendering

**Old Pattern** (Skeleton fallbacks):

```typescript
// ❌ Always shows component with skeleton when no data
return (
  <Card>
    <CardHeader><CardTitle>Chart Title</CardTitle></CardHeader>
    {hasData ? <ChartContent /> : <SkeletonLoader />}
  </Card>
);
```

**New Pattern** (Conditional rendering):

```typescript
// ✅ Component doesn't render when no meaningful data
const hasData = useMemo(() => validateDataMeaning(data), [data]);

if (!hasData) return null;

return (
  <Card>
    <CardHeader><CardTitle>Chart Title</CardTitle></CardHeader>
    <ChartContent />
  </Card>
);
```

### Hook Architecture Benefits

**Performance Benefits**:

- **62% Code Reduction**: From 140+ lines to 53 lines in insights screen
- **Zero Dashboard Re-renders**: Optimized dependencies prevent cascading updates
- **Debounced Triggers**: 50ms debouncing prevents excessive re-renders
- **Minimal State Exposure**: Only necessary state exposed to prevent subscriptions

**Developer Experience Benefits**:

- **Specialized Hooks**: Each hook handles specific domain concerns
- **Consistent Patterns**: Uniform API across all management hooks
- **Built-in Operations**: CRUD, filtering, modal management included
- **Error Handling**: Toast notifications and confirmation dialogs integrated
- **TypeScript Support**: Full type safety across all hook interfaces

**User Experience Benefits**:

- **Optimistic Updates**: Immediate UI feedback with error recovery
- **Cross-Screen Sync**: Real-time updates across all screens
- **Conditional Rendering**: Clean UI without empty states
- **Loading States**: Unified refresh indicators and pull-to-refresh

### Adding New Screens

1. **Add trigger to AppContext** (if needed)
2. **Use local state** for screen data
3. **Listen to relevant triggers** for auto-refresh
4. **Use `appActions.setRefreshing()`** for loading states
5. **Follow optimistic update pattern** for operations

## Testing the System

### Real-World Flow Test

1. **Dashboard** → Note pending transaction count
2. **Navigate to Approve Transaction** → See pending list
3. **Approve any transaction** → Returns to dashboard
4. **Dashboard automatically updated** → Count decreased, KPIs updated
5. **Check Transaction List** → Shows approved transaction
6. **View Insights** → Charts include approved transaction data

### Performance Verification

- **Rapid operations**: Multiple approvals don't cause render storms
- **Background processing**: SMS parsing triggers appropriate updates
- **Navigation speed**: No loading delays between screens
- **Memory usage**: No memory leaks from excessive re-renders

## Future Considerations

### Potential Extensions

- **Real-time updates**: WebSocket integration for multi-device sync
- **Offline support**: Queue operations when offline
- **Analytics triggers**: Track user actions for insights
- **Notification system**: Push notifications for background events

### Architecture Scaling

- **Micro-triggers**: More granular update control
- **State persistence**: Survive app restarts
- **Background sync**: Coordinate with SMS processing
- **Error recovery**: Automatic retry mechanisms

## Conclusion

The current state management system provides an optimal balance of:

- **Performance**: Debounced, selective updates
- **Simplicity**: Clear patterns and minimal boilerplate
- **Reliability**: Optimistic updates with error recovery
- **Scalability**: Easy to extend with new triggers and screens

This architecture has proven effective for the Money Trail app's requirements and provides a solid foundation for future enhancements.
