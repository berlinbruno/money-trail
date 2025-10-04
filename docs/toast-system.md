# Toast System Documentation

Complete guide to Money Trail's unified toast notification system.

## Overview

The Toast System provides centralized toast notifications across the app using a simple, consistent API. It wraps Android's native `ToastAndroid` with fallback console logging for development.

## Architecture

```text
ToastProvider
├── Native ToastAndroid (Android)
├── Console fallback (Development)
└── useToast() hook
```

## Setup

The ToastProvider is already configured in the app root layout. Simply import and use the hook:

```typescript
import { useToast } from '@/contexts/ToastProvider';
```

## Basic Usage

### Simple Toast

```typescript
import { useToast } from '@/contexts/ToastProvider';

const MyComponent = () => {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Operation completed successfully!');
  };

  return (
    <Button onPress={handleSuccess}>Complete Task</Button>
  );
};
```

### Toast with Configuration

```typescript
const { showToast } = useToast();

const showDetailedToast = () => {
  showToast({
    message: 'Data saved to local storage',
    duration: 'LONG',
    position: 'CENTER',
  });
};
```

## Configuration Options

### Message Parameter

```typescript
// String format (recommended)
showToast('Simple success message');

// Object format (advanced)
showToast({
  message: 'Detailed configuration message',
  duration: 'LONG',
  position: 'CENTER',
});
```

### Duration Options

| Value     | Android Constant     | Display Time | Use Case           |
| --------- | -------------------- | ------------ | ------------------ |
| `'SHORT'` | `ToastAndroid.SHORT` | ~2 seconds   | Quick feedback     |
| `'LONG'`  | `ToastAndroid.LONG`  | ~3.5 seconds | Important messages |

**Default:** `'SHORT'`

### Position Options

| Value      | Android Constant      | Location         | Use Case          |
| ---------- | --------------------- | ---------------- | ----------------- |
| `'BOTTOM'` | `ToastAndroid.BOTTOM` | Bottom of screen | Default position  |
| `'CENTER'` | `ToastAndroid.CENTER` | Center of screen | Important notices |
| `'TOP'`    | `ToastAndroid.TOP`    | Top of screen    | Status updates    |

**Default:** `'BOTTOM'`

## Common Patterns

### Success Messages

```typescript
const handleSave = async () => {
  try {
    await saveTransaction(data);
    showToast('Transaction saved successfully');
  } catch (error) {
    showToast('Failed to save transaction');
  }
};
```

### Error Messages

```typescript
const handleError = (error: Error) => {
  if (error.code === 'NETWORK_ERROR') {
    showToast('No internet connection available');
  } else if (error.code === 'PERMISSION_DENIED') {
    showToast('Permission required for this action');
  } else {
    showToast('An unexpected error occurred');
  }
};
```

### Loading Completion

```typescript
const handleLongOperation = async () => {
  try {
    setLoading(true);
    await performLongOperation();
    showToast({
      message: 'Operation completed successfully',
      duration: 'LONG',
    });
  } catch (error) {
    showToast('Operation failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Data Synchronization

```typescript
const handleSync = async () => {
  try {
    const result = await syncTransactions();
    showToast(`Synced ${result.count} transactions`);
  } catch (error) {
    showToast('Sync failed. Check your connection.');
  }
};
```

### Permission Feedback

```typescript
const handlePermissionResult = (granted: boolean) => {
  if (granted) {
    showToast('Permission granted');
  } else {
    showToast({
      message: 'Permission denied. Some features may not work.',
      duration: 'LONG',
    });
  }
};
```

## Integration with Other Systems

### With Dialog System

```typescript
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';

const MyComponent = () => {
  const { showConfirmationDialog } = useDialog();
  const { showToast } = useToast();

  const handleDelete = useCallback(
    (id: string) => {
      showConfirmationDialog({
        title: 'Delete Transaction',
        description: 'Are you sure you want to delete this transaction?',
        confirmVariant: 'destructive',
        onConfirm: async () => {
          try {
            await deleteTransaction(db, id);
            showToast('Transaction deleted successfully');
          } catch (error) {
            showToast('Failed to delete transaction');
            throw error;
          }
        },
      });
    },
    [showConfirmationDialog, showToast]
  );
};
```

### With Database Operations

```typescript
const useDatabaseOperations = () => {
  const { showToast } = useToast();
  const db = useSQLiteContext();

  const saveTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        await insertTransaction(db, transaction);
        showToast('Transaction added');
        return true;
      } catch (error) {
        console.error('Save failed:', error);
        showToast('Failed to save transaction');
        return false;
      }
    },
    [db, showToast]
  );

  return { saveTransaction };
};
```

### With Form Validation

```typescript
const handleFormSubmit = async (data: FormData) => {
  // Validation
  if (!data.amount) {
    showToast('Amount is required');
    return;
  }

  if (data.amount <= 0) {
    showToast('Amount must be greater than zero');
    return;
  }

  // Save
  try {
    await saveData(data);
    showToast('Data saved successfully');
  } catch (error) {
    showToast('Failed to save data');
  }
};
```

## Best Practices

### 1. Keep Messages Concise

```typescript
// ✅ Good - Clear and concise
showToast('Transaction deleted');
showToast('Sync completed');
showToast('Permission required');

// ❌ Bad - Too verbose
showToast(
  'The transaction has been successfully deleted from the database and can no longer be recovered'
);
```

### 2. Use Appropriate Duration

```typescript
// ✅ Good - Short for quick feedback
showToast('Saved');

// ✅ Good - Long for important information
showToast({
  message: 'Backup completed. Data is safe.',
  duration: 'LONG',
});

// ❌ Bad - Long duration for simple feedback
showToast({
  message: 'Deleted',
  duration: 'LONG',
});
```

### 3. Provide Actionable Information

```typescript
// ✅ Good - Tells user what happened and what to do
showToast('No internet connection. Please check your network.');
showToast('Permission denied. Enable in app settings.');

// ❌ Bad - Vague or unhelpful
showToast('Error occurred');
showToast('Something went wrong');
```

### 4. Use Consistent Language

```typescript
// ✅ Good - Consistent past tense for completed actions
showToast('Transaction saved');
showToast('Data exported');
showToast('Settings updated');

// ❌ Bad - Inconsistent tenses
showToast('Saving transaction');
showToast('Data exported');
showToast('Will update settings');
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good - Specific error handling
const handleOperation = async () => {
  try {
    await performOperation();
    showToast('Operation completed');
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      showToast('Network error. Please try again.');
    } else if (error.code === 'INSUFFICIENT_SPACE') {
      showToast('Not enough storage space available.');
    } else {
      showToast('Operation failed. Please try again.');
    }
  }
};

// ❌ Bad - Generic error handling
const handleOperation = async () => {
  try {
    await performOperation();
    showToast('Success');
  } catch (error) {
    showToast('Error');
  }
};
```

## Message Categories

### Success Message Examples

```typescript
// Data operations
showToast('Transaction saved');
showToast('Settings updated');
showToast('Data exported');
showToast('Backup completed');

// Sync operations
showToast('Sync completed');
showToast(`Synced ${count} transactions`);
showToast('Data refreshed');
```

### Error Messages

```typescript
// Network errors
showToast('No internet connection');
showToast('Server unavailable. Try again later.');
showToast('Connection timeout. Please retry.');

// Permission errors
showToast('Permission required for this feature');
showToast('SMS access denied');
showToast('Storage permission needed');

// Validation errors
showToast('Amount is required');
showToast('Invalid date format');
showToast('Category must be selected');

// System errors
showToast('Insufficient storage space');
showToast('Operation failed. Please try again.');
showToast('Database error occurred');
```

### Info Messages

```typescript
// Status updates
showToast('Processing in background');
showToast('No new transactions found');
showToast('Data is up to date');

// Feature notifications
showToast('Feature not available offline');
showToast('Pro feature requires upgrade');
showToast('Beta feature enabled');
```

## TypeScript Types

```typescript
interface ToastConfig {
  message: string;
  duration?: 'SHORT' | 'LONG';
  position?: 'TOP' | 'BOTTOM' | 'CENTER';
}

interface ToastContextType {
  showToast: (message: string | ToastConfig) => void;
}
```

## Platform Considerations

### Android

- Uses native `ToastAndroid` for optimal performance
- Supports all duration and position options
- Automatically handles system-level toast queue
- Respects user's accessibility settings

### Development/Testing

- Falls back to console logging when `ToastAndroid` is unavailable
- Maintains same API for consistency
- Useful for debugging and testing

## Common Patterns by Feature

### SMS Sync

```typescript
const handleSMSSync = async () => {
  try {
    const result = await syncSMSMessages();
    if (result.newTransactions > 0) {
      showToast(`Found ${result.newTransactions} new transactions`);
    } else {
      showToast('No new transactions found');
    }
  } catch (error) {
    if (error.code === 'PERMISSION_DENIED') {
      showToast('SMS permission required for sync');
    } else {
      showToast('Sync failed. Please try again.');
    }
  }
};
```

### Transaction Management

```typescript
const useTransactionToasts = () => {
  const { showToast } = useToast();

  return {
    onTransactionSaved: () => showToast('Transaction saved'),
    onTransactionUpdated: () => showToast('Transaction updated'),
    onTransactionDeleted: () => showToast('Transaction deleted'),
    onTransactionError: (action: string) => showToast(`Failed to ${action} transaction`),
    onValidationError: (field: string) => showToast(`${field} is required`),
  };
};
```

### Settings and Configuration

```typescript
const handleSettingsUpdate = async (setting: string, value: any) => {
  try {
    await updateSetting(setting, value);
    showToast('Settings saved');
  } catch (error) {
    showToast('Failed to save settings');
  }
};

const handleDataReset = async () => {
  try {
    await resetAllData();
    showToast({
      message: 'All data has been reset',
      duration: 'LONG',
    });
  } catch (error) {
    showToast('Failed to reset data');
  }
};
```

## Troubleshooting

### Toast Not Showing

1. **Check Provider**: Ensure ToastProvider wraps your component tree
2. **Check Hook**: Use `useToast()` hook correctly
3. **Platform Check**: Verify ToastAndroid is available on device

### Messages Not Clear

1. **Be Specific**: Provide clear, actionable messages
2. **Use Context**: Include relevant details (counts, names, etc.)
3. **Consistent Language**: Use standard terminology throughout app

### Performance Issues

1. **Avoid Spam**: Don't show multiple toasts rapidly
2. **Throttle Messages**: Consider debouncing repeated actions
3. **Keep Simple**: Use simple string messages when possible

## Migration Guide

### From Custom Toast Components

**Before:**

```typescript
const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState('');

const showCustomToast = (message: string) => {
  setToastMessage(message);
  setToastVisible(true);
  setTimeout(() => setToastVisible(false), 2000);
};

return (
  <>
    {/* Your component */}
    {toastVisible && (
      <Text style={styles.toast}>{toastMessage}</Text>
    )}
  </>
);
```

**After:**

```typescript
const { showToast } = useToast();

// No state management needed
// No UI components needed

const handleAction = () => {
  showToast('Action completed');
};
```

### From Alert-based Notifications

**Before:**

```typescript
import { Alert } from 'react-native';

const showNotification = (message: string) => {
  Alert.alert('Notification', message);
};
```

**After:**

```typescript
import { useToast } from '@/contexts/ToastProvider';

const { showToast } = useToast();

const showNotification = (message: string) => {
  showToast(message);
};
```
