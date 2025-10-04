# Documentation Index

Complete documentation for Money Trail's development systems and architecture.

## Core Systems Documentation

### 🎯 [Dialog System](./dialog-system.md)

Centralized dialog management for confirmations and permissions

- Unified `useDialog()` hook
- Confirmation dialogs with loading states
- Permission dialogs with settings integration
- Migration guide from individual components

### 🍞 [Toast System](./toast-system.md)

Unified toast notification system

- Simple `showToast()` API
- Native Android integration

- Duration and position configuration

- Message categories and best practices

### 🗄️ [Database Context](./database-context.md)

SQLite database patterns and query organization

- `useSQLiteContext()` hook usage

- Domain-specific query files
- Transaction management and error handling
- Performance optimization patterns

### 🔧 [Common Systems](./common-systems.md)

Comprehensive guide to all shared app systems

- Theme system and styling
- State management patterns
- Error handling strategies
- Development workflow guidelines

### 🌍 [Environment Variables](./environment-variables.md)

Configuration and environment setup

- Environment variable configuration
- EAS project setup
- Build configuration patterns
- Security best practices

## Quick Start Guide

### For New Developers

1. **Setup Environment**: Follow [Environment Variables](./environment-variables.md) setup
2. **Understand Core Systems**: Review [Common Systems](./common-systems.md) overview
3. **Learn Database Patterns**: Study [Database Context](./database-context.md) usage
4. **Master UI Systems**: Read [Dialog System](./dialog-system.md) and [Toast System](./toast-system.md)

### For Feature Development

1. **Use Centralized Dialogs**: Import `useDialog()` for all confirmations
2. **Use Toast Notifications**: Import `useToast()` for feedback messages
3. **Follow Database Patterns**: Use domain-specific query files
4. **Apply Consistent Styling**: Use NativeWind classes with theme support

## System Integration Examples

### Complete CRUD Operation with Feedback

```typescript
import { useDialog } from '@/contexts/DialogProvider';
import { useToast } from '@/contexts/ToastProvider';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteTransaction } from '@/lib/db/transactionQueries';

const useTransactionOperations = () => {
  const { showConfirmationDialog } = useDialog();
  const { showToast } = useToast();
  const db = useSQLiteContext();

  const handleDelete = useCallback(
    (transaction: Transaction) => {
      showConfirmationDialog({
        title: 'Delete Transaction',
        description: `Delete "${transaction.description}" for $${transaction.amount}?`,
        confirmText: 'Delete',
        confirmVariant: 'destructive',
        loadingText: 'Deleting transaction...',
        onConfirm: async () => {
          try {
            await deleteTransaction(db, transaction.id);
            showToast('Transaction deleted successfully');
          } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete transaction');
            throw error; // Let dialog handle error state
          }
        },
      });
    },
    [showConfirmationDialog, showToast, db]
  );

  return { handleDelete };
};
```

## Architecture Overview

```text
Money Trail App Architecture
├── React Native Expo
├── SQLite Database (WAL mode)
├── Centralized Systems
│   ├── DialogProvider (Confirmations + Permissions)
│   ├── ToastProvider (Native notifications)
│   ├── ThemeProvider (Dark/Light themes)
│   └── AppProvider (Global state)
├── Database Layer
│   ├── useSQLiteContext() hook
│   ├── Domain query files (lib/db/)
│   └── Type-safe operations
└── UI Components
    ├── NativeWind styling
    ├── Reusable primitives (components/ui/)
    └── Feature components (components/{domain}/)
```

## Development Patterns

### State Management Strategy

1. **Local State**: `useState` for component-specific UI state
2. **Database State**: Direct SQLite queries with `useSQLiteContext()`
3. **Global State**: Context providers for app-wide concerns
4. **Derived State**: Computed values from database queries

### Error Handling Strategy

1. **Database Errors**: Try-catch with fallback values and user feedback
2. **Permission Errors**: Centralized dialogs with settings navigation
3. **Network Errors**: Toast notifications with retry suggestions
4. **Validation Errors**: Immediate toast feedback

### Component Organization

```text
components/
├── ui/              # Reusable UI primitives
├── dialogs/         # Centralized dialog components
├── {domain}/        # Feature-specific components
└── layouts/         # Layout and navigation components
```

## Key Technologies

- **React Native**: Expo managed workflow
- **Database**: SQLite with expo-sqlite (WAL mode)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Navigation**: Expo Router with drawer + tabs
- **State**: React Context + SQLite
- **TypeScript**: Full type safety throughout

## Best Practices Summary

### Database Operations

- Use domain-specific query files

- Handle errors gracefully with fallbacks
- Use database transactions for related operations
- Implement proper TypeScript typing

### User Interface

- Use centralized dialog system for confirmations
- Provide immediate toast feedback for actions
- Follow consistent styling patterns
- Implement proper loading states

### Error Handling

- Always provide user-friendly error messages

- Log errors for debugging while showing helpful UI
- Use appropriate error recovery strategies
- Never leave users with broken states

### Performance

- Use SQLite indexes for common queries
- Implement pagination for large data sets
- Use React.useCallback for database operations
- Minimize re-renders with proper dependencies

## Contributing Guidelines

### Code Organization

1. Follow established folder structure
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add documentation for complex logic

### UI Development

1. Use centralized dialog and toast systems
2. Follow NativeWind styling patterns
3. Implement consistent loading states
4. Test on Android devices

### Database Development

1. Add queries to appropriate domain files
2. Use proper TypeScript interfaces
3. Handle errors gracefully
4. Optimize for performance

## Troubleshooting Guide

### Common Issues

| Issue                             | Solution                           | Documentation                                            |
| --------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Dialog not showing                | Check DialogProvider setup         | [Dialog System](./dialog-system.md#troubleshooting)      |
| Toast not appearing               | Verify ToastProvider configuration | [Toast System](./toast-system.md#troubleshooting)        |
| Database connection errors        | Check SQLite context usage         | [Database Context](./database-context.md#error-handling) |
| Environment variables not loading | Verify .env file setup             | [Environment Variables](./environment-variables.md)      |
| Styling issues                    | Check NativeWind configuration     | [Common Systems](./common-systems.md#theme-system)       |

### Debug Workflow

1. **Check Provider Setup**: Ensure all providers are correctly configured in app layout
2. **Verify Hook Usage**: Use correct hooks (`useDialog`, `useToast`, `useSQLiteContext`)
3. **Review Error Logs**: Check console for detailed error messages
4. **Test Device Compatibility**: Verify functionality on target Android devices
5. **Validate Configuration**: Use `npx expo config` to check resolved configuration

## Documentation Maintenance

This documentation is kept up-to-date with the latest codebase changes. When making significant system changes:

1. Update relevant documentation files
2. Add examples for new patterns
3. Update troubleshooting guides
4. Review and update this index

Last updated: October 2025
