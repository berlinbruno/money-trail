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

### 3. Unified AppProvider (`contexts/AppProvider.tsx`)

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

## Implementation Patterns

### 1. Screen State Management Pattern

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

- ✅ Uses `useTransaction()` for operations
- ✅ Local state with filter management
- ✅ Optimistic updates with fallback
- ✅ Responds to: `transactionListTrigger`

### Approve Transaction Screen (`app/(drawer)/approveTransaction.tsx`)

- ✅ Uses `useTransaction()` for approve/delete operations
- ✅ Filters pending transactions locally
- ✅ Automatic cross-screen updates on operations
- ✅ Responds to: `transactionListTrigger`

### Settings, Insights, Alerts Screens

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

**Old Pattern** (Heavy `useTransactionState`):

```typescript
// ❌ Heavy, complex state management
const { transactions, loading, actions } = useTransactionState();
```

**New Pattern** (Lightweight operations):

```typescript
// ✅ Lightweight operations + local state
const { approveTransaction, removeTransaction } = useTransaction();
const [transactions, setTransactions] = useState([]);
```

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
