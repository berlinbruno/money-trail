# AppContext State Management System

## Overview

The AppContext system provides centralized state management for the Money Trail app, enabling automatic cross-screen synchronization and real-time updates. This replaces manual refresh logic with a trigger-based system that keeps all screens in sync.

## Architecture

### 1. AppContext (`contexts/AppContext.tsx`)

Central state management provider that tracks:

- **Refresh Triggers**: Counters that increment when data changes
- **Loading States**: Global loading/refreshing indicators
- **Update Timestamps**: Track when different data types were last updated

### 2. Transaction State Hook (`hooks/useTransactionState.ts`)

Domain-specific hook that:

- Manages transaction data and filters
- Auto-refreshes when AppContext triggers change
- Provides transaction actions (approve, reject, delete)
- Triggers cross-screen updates when data changes

## Key Features

### ✅ **Automatic Cross-Screen Updates**

- Approve a transaction → Dashboard KPIs update automatically
- Change settings → Background tasks refresh automatically
- Add/delete transactions → Insights charts update automatically

### ✅ **Smart Refresh Triggers**

- Each action triggers only relevant screen updates
- No unnecessary re-renders or API calls
- Efficient update propagation across the app

### ✅ **Consistent Data State**

- All screens show the same data at all times
- No stale data between screen navigation
- Real-time synchronization without manual intervention

## Usage Examples

### Basic Transaction Management

```typescript
import { useTransactionState } from '@/hooks/useTransactionState';
import { useApp } from '@/contexts/AppContext';

function TransactionScreen() {
  const { transactions, pendingCount, actions } = useTransactionState();
  const { state: appState } = useApp();

  const handleApprove = async (transactionId: string) => {
    // This will automatically trigger updates across all screens
    await actions.approveTransaction(transactionId);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={actions.refresh}
        />
      }>
      {transactions.map(tx => (
        <TransactionCard
          key={tx.id}
          transaction={tx}
          onApprove={() => handleApprove(tx.id)}
        />
      ))}
    </ScrollView>
  );
}
```

### Cross-Screen Synchronization

```typescript
// Screen A: Approve transactions
function ApproveScreen() {
  const { actions } = useTransactionState();

  const handleApprove = async (id: string) => {
    await actions.approveTransaction(id);
    // Dashboard, Insights, and Transaction list automatically update
  };
}

// Screen B: Dashboard (automatically stays in sync)
function DashboardScreen() {
  const { pendingCount } = useTransactionState();
  // This counter updates automatically when transactions are approved

  return <Text>Pending: {pendingCount}</Text>;
}
```

### Filtering and Search

```typescript
function FilterableTransactionList() {
  const { transactions, filters, actions } = useTransactionState();

  const showPendingOnly = () => {
    actions.updateFilters({ status: 'pending' });
  };

  const searchTransactions = (term: string) => {
    actions.updateFilters({ searchTerm: term });
  };

  return (
    <View>
      <SearchInput onSearch={searchTransactions} />
      <FilterButton onPress={showPendingOnly} />
      <TransactionList transactions={transactions} />
    </View>
  );
}
```

## Integration with Existing Code

### 1. Add AppStateProvider to AppProvider

```typescript
// contexts/AppProvider.tsx
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppThemeProvider>
      <AppStateProvider> {/* Added this */}
        <DialogProvider>
          <ToastProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </ToastProvider>
        </DialogProvider>
      </AppStateProvider>
    </AppThemeProvider>
  );
}
```

### 2. Replace Manual State Management

**Before:**

```typescript
function MyScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getTransactions(db);
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);
}
```

**After:**

```typescript
function MyScreen() {
  const { transactions, loading, actions } = useTransactionState();
  // Data automatically loads and refreshes when needed
}
```

### 3. Update Action Handlers

**Before:**

```typescript
const handleApprove = async (id: string) => {
  await updateTransactionFlag(db, id, 0);
  showToast('Approved');
  // Manual refresh needed
  await fetchTransactions();
};
```

**After:**

```typescript
const handleApprove = async (id: string) => {
  await actions.approveTransaction(id);
  // Auto-refresh across all screens + toast handled
};
```

## State Flow Diagram

```
User Action (Approve Transaction)
         ↓
useTransactionState.approveTransaction()
         ↓
Update Database
         ↓
AppContext.triggerTransactionRefresh()
         ↓
All screens using useTransactionState auto-refresh
         ↓
UI updates across the entire app
```

## Benefits

### 🚀 **Developer Experience**

- Less boilerplate code
- No manual refresh logic
- Consistent patterns across screens
- Easier to add new features

### 🎯 **User Experience**

- Always up-to-date data
- Smooth navigation between screens
- Instant feedback on actions
- No loading delays for cached data

### 📈 **Performance**

- Efficient refresh targeting
- Reduced unnecessary API calls
- Optimized re-renders
- Better memory management

## Future Extensions

The system is designed to be extensible. Additional state hooks can be added:

- `useSettingsState()` - Settings management
- `useInsightsState()` - Dashboard insights
- `useAlertsState()` - Alert management
- `useDebugState()` - Debug information

Each hook follows the same pattern and integrates with the central AppContext for cross-screen synchronization.

## Testing the System

Use the demo screen at `/appContextDemo` to see the system in action:

1. View current state and triggers
2. Test transaction approval
3. See automatic updates
4. Try different filters
5. Observe cross-screen synchronization

The demo provides a clear visualization of how the state management system maintains consistency across the entire application.
