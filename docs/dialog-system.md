# Dialog System Documentation

Complete guide to Money Trail's centralized dialog management system.

## Overview

The Dialog System provides centralized management for both confirmation dialogs and permission dialogs through a single provider. This eliminates the need for individual component state management and ensures consistent dialog behavior across the app.

## Architecture

```text
DialogProvider
├── ConfirmationDialog (components/dialogs/)
├── PermissionDialog (components/dialogs/)
└── useDialog() hook
```

## Setup

The DialogProvider is already configured in the app root layout. Simply import and use the hook:

```typescript
import { useDialog } from '@/contexts/DialogProvider';
```

## Confirmation Dialogs

### Basic Example

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
        description:
          'Are you sure you want to delete this transaction? This action cannot be undone.',
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting...',
        onConfirm: async () => {
          try {
            await deleteTransaction(db, id);
            showToast('Transaction deleted successfully');
          } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete transaction');
            throw error; // Let dialog handle error state
          }
        },
      });
    },
    [showConfirmationDialog, showToast]
  );
};
```

### Configuration Options

| Property         | Type                          | Required | Default           | Description                |
| ---------------- | ----------------------------- | -------- | ----------------- | -------------------------- |
| `title`          | `string`                      | ✅       | -                 | Dialog title               |
| `description`    | `string`                      | ✅       | -                 | Dialog message/description |
| `confirmText`    | `string`                      | ❌       | `"Confirm"`       | Confirm button text        |
| `cancelText`     | `string`                      | ❌       | `"Cancel"`        | Cancel button text         |
| `confirmVariant` | `ButtonVariant`               | ❌       | `"default"`       | Confirm button style       |
| `loadingText`    | `string`                      | ❌       | `"Processing..."` | Loading state text         |
| `onConfirm`      | `() => void \| Promise<void>` | ✅       | -                 | Confirm action handler     |

### Button Variants

| Variant         | Use Case                | Appearance      |
| --------------- | ----------------------- | --------------- |
| `"default"`     | Standard confirmations  | Blue button     |
| `"destructive"` | Delete/remove actions   | Red button      |
| `"outline"`     | Secondary confirmations | Outlined button |
| `"secondary"`   | Alternative actions     | Gray button     |

### Common Patterns

#### Delete Confirmation

```typescript
const confirmDelete = (itemName: string, onDelete: () => Promise<void>) => {
  showConfirmationDialog({
    title: `Delete ${itemName}`,
    description: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    confirmText: 'Delete',
    confirmVariant: 'destructive',
    loadingText: 'Deleting...',
    onConfirm: onDelete,
  });
};
```

#### Save Confirmation

```typescript
const confirmSave = (hasChanges: boolean, onSave: () => Promise<void>) => {
  if (!hasChanges) return;

  showConfirmationDialog({
    title: 'Save Changes',
    description: 'Do you want to save your changes?',
    confirmText: 'Save',
    confirmVariant: 'default',
    loadingText: 'Saving...',
    onConfirm: onSave,
  });
};
```

#### Data Reset Confirmation

```typescript
const confirmReset = (dataType: string, onReset: () => Promise<void>) => {
  showConfirmationDialog({
    title: `Reset ${dataType}`,
    description: `This will permanently delete all ${dataType.toLowerCase()} data. This action cannot be undone.`,
    confirmText: 'Reset',
    confirmVariant: 'destructive',
    loadingText: 'Resetting...',
    onConfirm: onReset,
  });
};
```

## Permission Dialogs

### SMS Permission Check

```typescript
const enableSMSFeature = async () => {
  const { checkSMSPermissionWithDialog } = useDialog();

  const hasPermission = await checkSMSPermissionWithDialog();
  if (!hasPermission) {
    // User denied permission or needs to grant it manually
    console.log('SMS permission not granted');
    return;
  }

  // Permission granted, continue with SMS functionality
  await processSMSMessages();
};
```

### SMS Permission Request

```typescript
const requestSMSAccess = async () => {
  const { requestSMSPermissionWithDialog } = useDialog();

  const granted = await requestSMSPermissionWithDialog();
  if (granted) {
    showToast('SMS permission granted');
    // Initialize SMS features
  } else {
    showToast('SMS permission required for this feature');
  }
};
```

### Custom Permission Dialog

```typescript
const showCustomPermissionDialog = () => {
  const { showPermissionDialog } = useDialog();

  showPermissionDialog({
    title: 'Storage Permission Required',
    description:
      'This app needs storage access to save transaction data locally. Please grant permission in app settings.',
    showSettingsButton: true,
    isBlocking: false,
  });
};
```

### Permission Configuration

| Property             | Type      | Required | Default | Description                      |
| -------------------- | --------- | -------- | ------- | -------------------------------- |
| `title`              | `string`  | ✅       | -       | Dialog title                     |
| `description`        | `string`  | ✅       | -       | Permission explanation           |
| `showSettingsButton` | `boolean` | ❌       | `true`  | Show "Open Settings" button      |
| `isBlocking`         | `boolean` | ❌       | `false` | Prevent dismissal without action |

### Permission Methods

| Method                             | Return Type        | Description                                 |
| ---------------------------------- | ------------------ | ------------------------------------------- |
| `checkSMSPermissionWithDialog()`   | `Promise<boolean>` | Check SMS permission, show dialog if denied |
| `requestSMSPermissionWithDialog()` | `Promise<boolean>` | Request SMS permission with feedback        |
| `showPermissionDialog(config)`     | `void`             | Show custom permission dialog               |

## Advanced Usage

### Error Handling in Dialogs

```typescript
const handleComplexOperation = useCallback(async () => {
  showConfirmationDialog({
    title: 'Complex Operation',
    description: 'This will perform multiple steps that may take some time.',
    confirmText: 'Continue',
    loadingText: 'Processing...',
    onConfirm: async () => {
      try {
        // Step 1
        await performStep1();

        // Step 2
        await performStep2();

        // Step 3
        await performStep3();

        showToast('Operation completed successfully');
      } catch (error) {
        console.error('Operation failed:', error);

        if (error.code === 'NETWORK_ERROR') {
          showToast('Network error. Please check your connection.');
        } else if (error.code === 'PERMISSION_DENIED') {
          showToast('Permission denied. Please check app settings.');
        } else {
          showToast('Operation failed. Please try again.');
        }

        // Re-throw to let dialog handle error state
        throw error;
      }
    },
  });
}, [showConfirmationDialog, showToast]);
```

### Conditional Dialogs

```typescript
const handleAction = useCallback(
  (requiresConfirmation: boolean) => {
    if (!requiresConfirmation) {
      // Execute directly
      executeAction();
      return;
    }

    // Show confirmation
    showConfirmationDialog({
      title: 'Confirm Action',
      description: 'Are you sure you want to proceed?',
      onConfirm: executeAction,
    });
  },
  [showConfirmationDialog]
);
```

### Chained Dialogs

```typescript
const handleComplexWorkflow = useCallback(() => {
  showConfirmationDialog({
    title: 'Start Workflow',
    description: 'This will begin a multi-step process.',
    onConfirm: async () => {
      const result = await step1();

      if (result.needsConfirmation) {
        showConfirmationDialog({
          title: 'Continue Workflow',
          description: `Step 1 completed. Found ${result.count} items. Continue to step 2?`,
          onConfirm: step2,
        });
      } else {
        await step2();
      }
    },
  });
}, [showConfirmationDialog]);
```

## Best Practices

### 1. Always Use useCallback

```typescript
// ✅ Good - Prevents unnecessary re-renders
const handleDelete = useCallback(
  (id: string) => {
    showConfirmationDialog({
      // ... dialog config
    });
  },
  [showConfirmationDialog]
);

// ❌ Bad - Creates new function on every render
const handleDelete = (id: string) => {
  showConfirmationDialog({
    // ... dialog config
  });
};
```

### 2. Provide Clear Descriptions

```typescript
// ✅ Good - Clear and specific
description: 'Are you sure you want to delete this transaction? This action cannot be undone.';

// ❌ Bad - Vague and unclear
description: 'Are you sure?';
```

### 3. Use Appropriate Variants

```typescript
// ✅ Good - Destructive variant for delete
confirmVariant: 'destructive';

// ✅ Good - Default variant for save
confirmVariant: 'default';
```

### 4. Handle Errors Properly

```typescript
// ✅ Good - Comprehensive error handling
onConfirm: async () => {
  try {
    await performAction();
    showToast('Success message');
  } catch (error) {
    console.error('Action failed:', error);
    showToast('User-friendly error message');
    throw error; // Let dialog handle error state
  }
};

// ❌ Bad - No error handling
onConfirm: async () => {
  await performAction();
  showToast('Success message');
};
```

### 5. Include Loading States

```typescript
// ✅ Good - Descriptive loading text
loadingText: 'Deleting transaction...';

// ✅ Good - Generic but informative
loadingText: 'Processing...';

// ❌ Bad - No loading text
// (relies on default "Processing...")
```

## TypeScript Types

```typescript
interface ConfirmationDialogConfig {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'static';
  loadingText?: string;
  onConfirm: () => void | Promise<void>;
}

interface PermissionDialogConfig {
  title: string;
  description: string;
  showSettingsButton?: boolean;
  isBlocking?: boolean;
}

interface DialogContextType {
  // Confirmation dialogs
  showConfirmationDialog: (config: ConfirmationDialogConfig) => void;

  // Permission dialogs
  showPermissionDialog: (config: PermissionDialogConfig) => void;
  checkSMSPermissionWithDialog: () => Promise<boolean>;
  requestSMSPermissionWithDialog: () => Promise<boolean>;
}
```

## Troubleshooting

### Dialog Not Showing

1. **Check DialogProvider**: Ensure DialogProvider wraps your component tree
2. **Check Hook Usage**: Use `useDialog()` hook correctly
3. **Check Required Props**: Ensure `title`, `description`, and `onConfirm` are provided

### Loading State Issues

1. **Throw Errors**: Always throw errors in `onConfirm` to trigger error state
2. **Loading Text**: Provide meaningful `loadingText` for better UX
3. **Async Operations**: Ensure `onConfirm` is async when needed

### Permission Dialog Issues

1. **Check Permissions**: Verify actual device permissions
2. **Settings Button**: Use `showSettingsButton: true` for denied permissions
3. **Blocking Dialogs**: Use `isBlocking: true` only when necessary

## Migration Guide

### From Individual ConfirmationDialog Components

**Before:**

```typescript
const [showDialog, setShowDialog] = useState(false);
const [isLoading, setIsLoading] = useState(false);

const handleConfirm = async () => {
  setIsLoading(true);
  try {
    await performAction();
    setShowDialog(false);
    showToast('Success');
  } catch (error) {
    console.error(error);
    showToast('Error');
  } finally {
    setIsLoading(false);
  }
};

return (
  <>
    <Button onPress={() => setShowDialog(true)}>Delete</Button>
    <ConfirmationDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      title="Delete Item"
      description="Are you sure?"
      onConfirm={handleConfirm}
      loading={isLoading}
    />
  </>
);
```

**After:**

```typescript
const { showConfirmationDialog } = useDialog();

const handleDelete = useCallback(() => {
  showConfirmationDialog({
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item?',
    confirmVariant: 'destructive',
    onConfirm: async () => {
      try {
        await performAction();
        showToast('Success');
      } catch (error) {
        console.error(error);
        showToast('Error');
        throw error;
      }
    },
  });
}, [showConfirmationDialog]);

return (
  <Button onPress={handleDelete}>Delete</Button>
);
```
