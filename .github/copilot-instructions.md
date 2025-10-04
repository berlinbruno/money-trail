# Money Trail - AI Coding Assistant Instructions

## Project Overview

Money Trail is a React Native Expo app for automatic expense tracking via SMS parsing. It analyzes banking SMS messages to extract transaction data, categorize expenses, and provide financial insights through a dashboard interface.

## Architecture & Key Components

### Core SMS Processing Pipeline

- **SMS Collection**: `react-native-get-sms-android` fetches finance-related SMS using regex patterns
- **Transaction Parsing**: `utils/transactions/transactionParser.ts` extracts amounts, types (debit/credit), and metadata from SMS text
- **Background Processing**: `lib/sms/backgroundTask.ts` handles automatic SMS sync via Expo Background Tasks
- **SMS Sync Logic**: `lib/sms/sync.ts` orchestrates transaction processing and categorization
- **Deduplication**: Uses MD5 hashing (`utils/cryptoUtils.ts`) of SMS content to prevent duplicate transactions

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
- **WAL Mode**: Enabled for better concurrency (`PRAGMA journal_mode = WAL`)
- **Key Tables**: transactions, notifications, alerts, config, app_logs
- **Queries**: Organized in `lib/database/` with separate files per domain
- **Initialization**: Automatic table creation via `initializeDatabase()` function
- **Sync Configuration**: Stores sync intervals and app settings in `config` table

### State Management Patterns

- **Database Context**: `useSQLiteContext()` hook provides direct SQLite access throughout components
- **Dialog System**: Unified `useDialog()` hook with centralized dialog management (`DialogProvider`) for both confirmation and permission dialogs
- **Toast System**: Unified `useToast()` hook with simplified `showToast()` API across all components
- **Local Component State**: `useState` for UI state, `useCallback` for database operations
- **Data Fetching**: Async functions with Promise.all for parallel queries on dashboard

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
- **contexts/**: React context providers (DialogProvider, ToastProvider, AppProvider)
- **components/ui/**: Reusable UI primitives
- **components/dialogs/**: Centralized dialog components
- **components/{domain}/**: Feature-specific components
- **types/**: TypeScript type definitions

### Component Organization

- **UI Components**: `components/ui/` - Reusable UI primitives
- **Dialog Components**: `components/dialogs/` - Centralized dialog management
- **Feature Components**: `components/{domain}/` - Domain-specific components
- **Styling**: TailwindCSS via NativeWind with theme support

### Type Definitions

- **Domain Types**: `types/` folder with TypeScript interfaces for core entities
- **Database Types**: Include `ID` and `Timestamp` from `types/Common.ts`
- **Transaction Types**: Extensive typing for categories, modes, sources, and states

### Database Patterns

- **Query Functions**: Return typed results with proper error handling
- **Transactions**: Use database transactions for related operations
- **Config Storage**: App settings and sync state in `config` table
- **Type Safety**: Full TypeScript support for all database operations

### SMS Processing Specifics

- **Finance Regex**: Pattern matching for banking keywords and UPI apps
- **Category Mapping**: Automatic categorization based on merchant/description
- **Deduplication**: MD5 hash-based prevention of duplicate processing
- **Background Sync**: Configurable intervals with comprehensive logging

## Critical Integration Points

### Permissions & Performance

- **SMS Access**: Required for transaction parsing functionality
- **Background Tasks**: Enable automatic SMS processing
- **Database Optimization**: Indexed queries for performance
- **Memory Management**: Efficient SMS batch processing

## Common Development Tasks

**Best Practices**:

- Use `useCallback` for dialog handlers to prevent re-renders
- Include loading states with `loadingText`
- Handle errors by throwing in `onConfirm`
- Use appropriate `confirmVariant` for destructive actions

### Transaction Management

**Adding Categories**: Update `constants/transactionConstants.ts` and `lib/sms/sync.ts`

**SMS Parser**: Modify `utils/transactions/transactionParser.ts` for new patterns

**Dashboard Data**: Add KPI calculations in `lib/database/dashboardQueries.ts`

### Background Tasks

**Debugging**: Check registration status and monitor logs in `config` table

**Testing**: Use `executeTask()` function in `lib/sms/backgroundTask.ts`

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
