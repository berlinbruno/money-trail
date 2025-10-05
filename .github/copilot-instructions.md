# Money Trail - AI Coding Assistant Instructions

## Project Overview

Money Trail is a React Native Expo app for automatic expense tracking via SMS parsing. It analyzes banking SMS messages to extract transaction data, categorize expenses, and provide financial insights through a dashboard interface.

## Architecture & Key Components

### Core SMS Processing Pipeline

- **SMS Collection**: `react-native-get-sms-android` fetches finance-related SMS using comprehensive regex patterns (`financeRegex` in `lib/sms/sync.ts`)
- **Transaction Parsing**: `lib/sms/parser.ts` extracts amounts, types (debit/credit), and metadata from SMS text using pattern matching
- **Background Processing**: `lib/sms/backgroundTask.ts` handles automatic SMS sync via Expo Background Tasks with configurable intervals (min 15min)
- **SMS Sync Logic**: `lib/sms/sync.ts` orchestrates transaction processing, categorization, and comprehensive error handling with retry mechanisms
- **Deduplication**: Uses MD5 hashing (`utils/cryptoUtils.ts`) of SMS content + metadata to prevent duplicate transactions
- **Smart Categorization**: AI-driven categorization in `sync.ts` using keyword matching, merchant patterns, and amount-based heuristics

### Navigation Structure

```text
Stack (Root Layout)
└── Drawer Layout
    ├── Tabs Layout (Dashboard)
    │   ├── index.tsx (Dashboard)
    │   ├── transactions.tsx
    │   └── insights.tsx
    ├── alerts.tsx
    ├── approveTransaction.tsx
    └── settings.tsx
```

### Database Layer (SQLite)

- **Location**: `assets/database/app.db` (bundled), accessed via `expo-sqlite`
- **WAL Mode**: Enabled for better concurrency (`PRAGMA journal_mode = WAL`) with busy timeout (30s)
- **Key Tables**: transactions, notifications, alerts, app_logs (replaces old config/task_execution_logs)
- **Queries**: Organized in `lib/database/` with separate files per domain
- **Initialization**: Automatic table creation via `initializeDatabase()` function
- **Sync Configuration**: Stores sync intervals and app settings in `app_logs` table
- **Retry Logic**: Database operations include retry mechanisms for SQLITE_BUSY errors with exponential backoff
- **Transaction Approval**: `pending_approval` flag (0=approved, 1=pending) with auto-approval setting support

### Hook System

- **Lightweight Operations**: `useTransaction.ts` - Action-focused hook with:
  - Direct database operations only
  - Automatic cross-screen triggers via AppContext
  - Optimistic updates with error recovery
  - Built-in toast notifications and error handling
- **App Initialization**: `useAppInitialization.ts` - Handles app startup and permissions

## Development Workflow

### Running the App

```bash
npm run dev          # Start Expo dev server
npm run type-check   # TypeScript compilation check
npm run format       # Prettier formatting
npm run lint:fix     # Auto-fix linting issues
```

### Building & Deployment

- **Platform**: Android-only React Native Expo app
- **Key Permissions**: SMS access, background tasks, wake lock

## Key Patterns & Conventions

### Dialog System

- **Provider**: `contexts/DialogProvider.tsx` provides centralized dialog management
- **Usage**: `const { showConfirmationDialog, showPermissionDialog } = useDialog()` hook across all components
- **Confirmation Dialogs**: `showConfirmationDialog({title, description, onConfirm, ...})` for user confirmations
- **Permission Dialogs**: `showPermissionDialog({title, description, showSettingsButton, ...})` for permission requests
- **SMS Permissions**: `checkSMSPermissionWithDialog()` and `requestSMSPermissionWithDialog()` for SMS access
- **Components**: Reusable `ConfirmationDialog` and `PermissionDialog` components in `components/dialogs/`
- **Type Safety**: Full TypeScript support with proper interfaces and error handling
- **Best Practices**: Use centralized dialogs instead of individual component state management
- **Error Handling**: Throw errors in `onConfirm` handlers to let dialog manage loading/error states
- **Loading States**: Include `loadingText` for async operations, use appropriate `confirmVariant` for destructive actions

### Toast System

- **Provider**: `contexts/ToastProvider.tsx` provides unified toast notifications
- **Usage**: `const { showToast } = useToast()` hook across all components
- **API**: Simplified `showToast('message')` or `showToast({message, duration, position})`
- **Implementation**: Native Android `ToastAndroid` with fallback console logging
- **Best Practices**: Concise, actionable messages; success confirmations; error notifications

### Folder Organization

- **lib/database/**: All database operations and queries
- **lib/sms/**: SMS processing pipeline (`backgroundTask.ts`, `sync.ts`)
- **utils/transactions/**: Transaction-specific utilities
- **utils/finance/**: Financial calculations and insights
- **utils/**: Core utilities (formatters, crypto, permissions, etc.)
- **contexts/**: React context providers (AppProvider, DialogProvider, ToastProvider)
- **hooks/**: Custom hooks (`useTransaction.ts`, `useAppInitialization.ts`)
- **components/ui/**: Reusable UI primitives
- **components/dialogs/**: Centralized dialog components
- **components/{domain}/**: Feature-specific components
- **types/**: TypeScript type definitions

### Component Organization

- **UI Components**: `components/ui/` - Reusable UI primitives
- **Dialog Components**: `components/dialogs/` - Centralized dialog management
- **Feature Components**: `components/{domain}/` - Domain-specific components
  - **Dashboard**: `KPISection`, `QuickActionsSection`, `RecentTransactionsSection`, `TrendsSection`, `NotificationListSection`
- **Styling**: TailwindCSS via NativeWind with theme support

### Type Definitions

- **Domain Types**: `types/` folder with TypeScript interfaces for core entities
- **Database Types**: Include `ID` and `Timestamp` from `types/Common.ts`
- **Transaction Types**: Extensive typing for categories, modes, sources, and states

### Database Patterns

- **Query Functions**: Return typed results with proper error handling
- **Transactions**: Use database transactions for related operations
- **Config Storage**: App settings and sync state in `app_logs` table
- **Type Safety**: Full TypeScript support for all database operations
- **Retry Mechanisms**: Database operations include exponential backoff for SQLITE_BUSY errors
- **WAL Mode**: Always enabled with 30s busy timeout for better concurrency
- **Connection Management**: Use `useSQLiteContext()` hook for consistent database access

### SMS Processing Specifics

- **Finance Regex**: Pattern matching for banking keywords and UPI apps using comprehensive `financeRegex`
- **Category Mapping**: Automatic categorization based on merchant/description with extensive keyword lists
- **Deduplication**: MD5 hash-based prevention of duplicate processing using SMS content + metadata
- **Background Sync**: Configurable intervals (min 15min) with comprehensive logging via `app_logs` table
- **Error Handling**: Robust retry mechanisms with detailed error logging and categorization
- **Transaction Approval**: Support for both auto-approval and manual approval workflows

## Critical Integration Points

### Permissions & Performance

- **SMS Access**: Required for transaction parsing functionality
- **Background Tasks**: Enable automatic SMS processing
- **Database Optimization**: Indexed queries for performance
- **Memory Management**: Efficient SMS batch processing

## Common Development Tasks

### Dialog Usage Best Practices

```typescript
// Transaction operations with new hook
const { removeTransaction, updateTransactionState } = useTransaction();

const handleDeleteTransaction = useCallback(
  (id: string) => {
    showConfirmationDialog({
      title: 'Delete Transaction',
      description: 'Are you sure you want to delete this transaction?',
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      loadingText: 'Deleting...',
      onConfirm: async () => {
        try {
          // Optimistic update
          updateTransactionState(setTransactions, 'delete', id);
          await removeTransaction(id);
          showToast('Transaction deleted');
        } catch (err) {
          console.error('Failed to delete:', err);
          await fetchTransactions(false); // Revert on error
          throw err; // Let dialog handle error state
        }
      },
    });
  },
  [removeTransaction, updateTransactionState, showConfirmationDialog]
);
```

**Best Practices**:

- Use `useCallback` for dialog handlers to prevent re-renders
- Include loading states with `loadingText`
- Handle errors by throwing in `onConfirm`
- Use appropriate `confirmVariant` for destructive actions

### Transaction Management

**Adding Categories**: Update `constants/transactionConstants.ts` and categorization logic in `lib/sms/sync.ts`

**SMS Parser**: Modify parsing logic in `lib/sms/parser.ts` for new banking SMS patterns

**Dashboard Data**: Add KPI calculations in `lib/database/dashboardQueries.ts`

**Dashboard Components**: Use renamed components without "Dashboard" prefix:

- `KPISection` (was `DashboardKPISection`)
- `QuickActionsSection` (was `DashboardQuickActionsSection`)
- `RecentTransactionsSection` (was `DashboardRecentTransactionsSection`)
- `TrendsSection` (was `DashboardTrendsSection`)
- `NotificationListSection` (was `DashboardNotificationsSection`)

### Performance Optimization Patterns

**State Management Performance**:

- Use lightweight `useTransaction` hook for operations with automatic triggers
- Implement optimistic updates for immediate UI feedback, then trigger AppContext refresh
- Use specific AppContext triggers for targeted updates (avoid triggering unnecessary re-renders)
- Local component state + auto-refresh pattern instead of heavy state management hooks

**App Context Integration**:

- Use specific triggers: `appActions.triggerKpiUpdate()`, `appActions.triggerRecentTransactionsUpdate()`, `appActions.triggerPendingTransactionCountUpdate()`
- Use combined triggers: `appActions.triggerTransactionDataUpdate()`, `appActions.triggerDashboardDataUpdate()`
- Debounced triggers (50ms) prevent excessive re-renders across components
- Use `appActions.setRefreshing()` for global loading states
- Pattern: Local state + `useEffect(() => { fetchData(); }, [appState.relevantTrigger])`

**Database Operation Patterns**:

- Perform database operation first, then update local state optimistically
- Use app context triggers for cross-component updates (dashboard, insights, etc.)
- Implement fallback data refresh if optimistic updates fail
- Batch operations when possible to reduce database calls

**SwipeListView Performance**:

- Memoize `renderItem` and `renderHiddenItem` functions with `useCallback`
- Use memoized `keyExtractor` function to prevent re-renders
- Implement `removeClippedSubviews={true}` for better memory management
- Set appropriate `maxToRenderPerBatch`, `updateCellsBatchingPeriod`, `initialNumToRender`, and `windowSize`
- Avoid complex calculations in render functions
- Use swipe configuration objects memoized with `useMemo`

### Background Tasks

**Testing**: Use `executeTask()` function in `lib/sms/backgroundTask.ts` for manual execution

**Configuration**: Update intervals via `updateTaskConfiguration()` with minimum 15-minute intervals

**Debugging**: Check registration status with `getTaskStatus()` and monitor logs in `app_logs` table

## Documentation References

### Core Documentation

- **State Management**: `docs/state-management.md` - Comprehensive guide to AppContext system, triggers, and patterns
- **Dialog System**: `docs/dialog-system.md` - Centralized dialog management patterns
- **Toast System**: `docs/toast-system.md` - Unified notification system
- **Database Context**: `docs/database-context.md` - SQLite patterns and query organization
- **Common Systems**: `docs/common-systems.md` - Theme, styling, and shared patterns

### Key Patterns Summary

- **Component Operations**: Use `useTransaction()` hook for database operations with automatic triggers
- **Cross-Screen Updates**: Operations trigger AppContext updates across all relevant screens
- **Local State Pattern**: Component manages local state + auto-refresh on AppContext triggers
- **Dialog Integration**: Use `useDialog()` for confirmations with loading states and error handling
- **Toast Feedback**: Use `useToast()` for immediate user feedback on operations

## File Organization Best Practices

### Import Path Patterns

- **Database**: `@/lib/database/{queryFile}`
- **SMS Processing**: `@/lib/sms/{module}`
- **Utilities**: `@/utils/{category}/{file}`
- **Contexts**: `@/contexts/{Provider}`
- **Components**: `@/components/{category}/{component}`
- **Types**: `@/types/{Type}`

### Code Organization Principles

- **Feature-based Structure**: Group related functionality together
- **Single Responsibility**: Each file has a clear, focused purpose
- **TypeScript First**: Full type safety throughout the application
- **Centralized State**: Unified context providers for shared functionality
- **Consistent Patterns**: Use established hooks and patterns across components
