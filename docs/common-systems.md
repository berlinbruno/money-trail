# Common Systems Documentation

This document covers the unified systems used throughout Money Trail for consistent user experience and developer productivity.

## Dialog System

The Money Trail app uses a centralized dialog management system that handles both confirmation dialogs and permission dialogs through a single provider.

### Overview

- **Provider**: `contexts/DialogProvider.tsx`
- **Hook**: `useDialog()`
- **Components**: `components/dialogs/ConfirmationDialog.tsx`, `components/dialogs/PermissionDialog.tsx`

### Basic Usage

```typescript
import { useDialog } from '@/contexts/DialogProvider';

const MyComponent = () => {
  const { showConfirmationDialog, showPermissionDialog } = useDialog();

  // Component logic here
};
```

### Confirmation Dialogs

Use confirmation dialogs for user actions that require verification.

```typescript
const handleDelete = useCallback(
  (id: string) => {
    showConfirmationDialog({
      title: 'Delete Item',
      description: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      loadingText: 'Deleting...',
      onConfirm: async () => {
        try {
          await deleteItem(db, id);
          showToast('Item deleted successfully');
        } catch (error) {
          console.error('Delete failed:', error);
          showToast('Failed to delete item');
          throw error; // Let dialog handle error state
        }
      },
    });
  },
  [showConfirmationDialog, db, showToast]
);
```

#### Confirmation Dialog Options

| Property         | Type       | Description                | Default           |
| ---------------- | ---------- | -------------------------- | ----------------- |
| `title`          | `string`   | Dialog title               | Required          |
| `description`    | `string`   | Dialog description/message | Required          |
| `confirmText`    | `string`   | Confirm button text        | `"Confirm"`       |
| `cancelText`     | `string`   | Cancel button text         | `"Cancel"`        |
| `confirmVariant` | `string`   | Button variant             | `"default"`       |
| `loadingText`    | `string`   | Loading state text         | `"Processing..."` |
| `onConfirm`      | `function` | Confirm action handler     | Required          |

#### Confirm Variants

- `"default"` - Standard confirmation
- `"destructive"` - Red button for delete/remove actions
- `"outline"` - Outlined button style
- `"secondary"` - Secondary button style

### Permission Dialogs

Use permission dialogs for requesting and managing app permissions.

```typescript
const enableSMSFeature = async () => {
  const hasPermission = await checkSMSPermissionWithDialog();
  if (!hasPermission) {
    // User will see permission dialog
    return;
  }

  // Continue with SMS-dependent feature
  await processSMSMessages();
};

// Manual permission dialog
const showCustomPermissionDialog = () => {
  showPermissionDialog({
    title: 'SMS Access Required',
    description: 'This feature requires SMS access to track transactions automatically.',
    showSettingsButton: true,
    isBlocking: false,
  });
};
```

#### Permission Dialog Options

| Property             | Type      | Description                      | Default  |
| -------------------- | --------- | -------------------------------- | -------- |
| `title`              | `string`  | Dialog title                     | Required |
| `description`        | `string`  | Permission explanation           | Required |
| `showSettingsButton` | `boolean` | Show "Open Settings" button      | `true`   |
| `isBlocking`         | `boolean` | Prevent dismissal without action | `false`  |

#### Permission Methods

| Method                             | Description                                 | Returns            |
| ---------------------------------- | ------------------------------------------- | ------------------ |
| `checkSMSPermissionWithDialog()`   | Check SMS permission, show dialog if denied | `Promise<boolean>` |
| `requestSMSPermissionWithDialog()` | Request SMS permission with user feedback   | `Promise<boolean>` |
| `showPermissionDialog(config)`     | Show custom permission dialog               | `void`             |

### Dialog Best Practices

1. **Use `useCallback`** for dialog handlers to prevent re-renders
2. **Include loading states** with appropriate `loadingText`
3. **Handle errors** by throwing in `onConfirm` to let dialog handle error state
4. **Choose appropriate variants** (`destructive` for delete operations)
5. **Never manage dialog state manually** - use the centralized provider
6. **Provide clear descriptions** explaining the action consequences
7. **Use consistent language** across similar dialogs

## Toast System

The toast system provides unified, non-intrusive notifications throughout the app.

### Toast Overview

- **Provider**: `contexts/ToastProvider.tsx`
- **Hook**: `useToast()`
- **Implementation**: Native Android `ToastAndroid` with console fallback

### Toast Usage

```typescript
import { useToast } from '@/contexts/ToastProvider';

const MyComponent = () => {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Operation completed successfully');
  };

  const handleError = () => {
    showToast('Failed to complete operation');
  };
};
```

### Toast API

#### Simple Toast

```typescript
showToast('Your message here');
```

#### Advanced Toast

```typescript
showToast({
  message: 'Custom toast message',
  duration: 'long', // 'short' | 'long'
  position: 'bottom', // 'top' | 'center' | 'bottom'
});
```

#### Toast Options

| Property   | Type                            | Description        | Default    |
| ---------- | ------------------------------- | ------------------ | ---------- |
| `message`  | `string`                        | Toast message text | Required   |
| `duration` | `'short' \| 'long'`             | Display duration   | `'short'`  |
| `position` | `'top' \| 'center' \| 'bottom'` | Screen position    | `'bottom'` |

### Toast Best Practices

1. **Keep messages concise** - Maximum 1-2 lines
2. **Use actionable language** - "Saved", "Deleted", "Failed to save"
3. **Provide success confirmations** for important actions
4. **Show error notifications** for failed operations
5. **Avoid technical jargon** - Use user-friendly language
6. **Don't overuse** - Only for significant events
7. **Be consistent** - Use similar language for similar actions

### Common Toast Patterns

```typescript
// Success confirmations
showToast('Transaction saved');
showToast('Settings updated');
showToast('Data synced successfully');

// Error notifications
showToast('Failed to save transaction');
showToast('Network error occurred');
showToast('Permission denied');

// Information updates
showToast('Background sync enabled');
showToast('No new transactions found');
showToast('Sync completed');
```

## Theme System

Money Trail supports both light and dark themes with automatic system detection.

### Theme Overview

- **Provider**: React Navigation's theme provider
- **Hook**: `useTheme()` from `@react-navigation/native`
- **Styling**: TailwindCSS via NativeWind with theme-aware classes

### Theme Usage

```typescript
import { useTheme } from '@react-navigation/native';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Themed content
      </Text>
    </View>
  );
};
```

### Theme Colors

#### Light Theme

- **Background**: `#FFFFFF`
- **Surface**: `#F8F9FA`
- **Primary**: `#007AFF`
- **Text**: `#000000`
- **Border**: `#E5E5E7`

#### Dark Theme

- **Background**: `#000000`
- **Surface**: `#1C1C1E`
- **Primary**: `#0A84FF`
- **Text**: `#FFFFFF`
- **Border**: `#38383A`

### TailwindCSS Theme Classes

```typescript
// Background colors
className = 'bg-background dark:bg-background';

// Text colors
className = 'text-foreground dark:text-foreground';

// Border colors
className = 'border-border dark:border-border';

// Component styling
className = 'bg-card dark:bg-card text-card-foreground dark:text-card-foreground';
```

### Theme Best Practices

1. **Use semantic colors** instead of hardcoded values
2. **Test both themes** during development
3. **Avoid theme-specific logic** in components
4. **Use theme-aware icons** with appropriate colors
5. **Respect system preferences** for theme selection

## Database Context

Money Trail uses SQLite with a centralized database context for all data operations.

### Database Overview

- **Provider**: `expo-sqlite` with React Context
- **Hook**: `useSQLiteContext()`
- **Location**: `assets/database/app.db`

### Database Usage

```typescript
import { useSQLiteContext } from 'expo-sqlite';
import { fetchTransactions } from '@/lib/database/transactionQueries';

const MyComponent = () => {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTransactions(db);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('Failed to load data');
      }
    };

    loadData();
  }, [db]);
};
```

### Database Best Practices

1. **Use typed query functions** from `lib/database/`
2. **Handle errors gracefully** with user-friendly messages
3. **Use transactions** for related operations
4. **Cache frequently accessed data** in component state
5. **Use `useCallback`** for database operations
6. **Show loading states** for async operations

## State Management Patterns

Money Trail uses a combination of React Context, local state, and database persistence.

### Context Providers

- **DialogProvider** - Centralized dialog management
- **ToastProvider** - Toast notifications
- **SQLite Context** - Database access
- **AppProvider** - Unified app-level state

### Local State Patterns

```typescript
// UI state
const [isLoading, setIsLoading] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

// Data fetching with useCallback
const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const data = await queryDatabase(db);
    setData(data);
  } catch (error) {
    console.error('Fetch failed:', error);
    showToast('Failed to load data');
  } finally {
    setIsLoading(false);
  }
}, [db, showToast]);

// Effect for data loading
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### State Best Practices

1. **Keep state close to usage** - Prefer local state when possible
2. **Use contexts for shared state** - Dialogs, toasts, theme
3. **Memoize expensive operations** with `useMemo` and `useCallback`
4. **Handle loading states** for better UX
5. **Persist important data** in SQLite database
6. **Use TypeScript** for all state definitions

## Error Handling

Consistent error handling across the application ensures a smooth user experience.

### Error Patterns

```typescript
// Database operations
const saveTransaction = async (transaction) => {
  try {
    await insertTransaction(db, transaction);
    showToast('Transaction saved');
  } catch (error) {
    console.error('Save failed:', error);
    showToast('Failed to save transaction');
    // Don't re-throw for UI operations
  }
};

// Dialog confirmation with error handling
const handleDelete = useCallback(async () => {
  showConfirmationDialog({
    title: 'Delete Transaction',
    description: 'This action cannot be undone.',
    onConfirm: async () => {
      try {
        await deleteTransaction(db, id);
        showToast('Transaction deleted');
      } catch (error) {
        console.error('Delete failed:', error);
        showToast('Failed to delete transaction');
        throw error; // Let dialog handle error state
      }
    },
  });
}, []);
```

### Error Best Practices

1. **Log errors** for debugging with `console.error`
2. **Show user-friendly messages** via toasts
3. **Handle errors at component level** for UI operations
4. **Let dialogs handle errors** by throwing in `onConfirm`
5. **Graceful degradation** when features fail
6. **Network error handling** for API calls
7. **Permission error handling** with helpful guidance
