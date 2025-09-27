# Money Trail - AI Coding Assistant Instructions

## Project Overview

Money Trail is a React Native Expo app for automatic expense tracking via SMS parsing. It analyzes banking SMS messages to extract transaction data, categorize expenses, and provide financial insights through a dashboard interface.

## Architecture & Key Components

### Core SMS Processing Pipeline

- **SMS Collection**: `react-native-get-sms-android` fetches finance-related SMS using regex patterns
- **Transaction Parsing**: `utils/transactions/transactionParser.ts` extracts amounts, types (debit/credit), and metadata from SMS text
- **Background Processing**: `lib/sms/backgroundTask.ts` handles automatic SMS sync via Expo Background Tasks every 10 minutes
- **SMS Sync Logic**: `lib/sms/sync.ts` orchestrates transaction processing and categorization
- **Deduplication**: Uses MD5 hashing (`crypto-js`) of SMS content to prevent duplicate transactions

### Navigation Structure

```text
Stack (Root Layout)
└── Drawer Layout
    ├── Tabs Layout (Dashboard)
    │   ├── index.tsx (Dashboard)
    │   ├── transactions.tsx
    │   └── insights.tsx
    └── settings.tsx
```

### Database Layer (SQLite)

- **Location**: `assets/database/app.db` (bundled), accessed via `expo-sqlite`
- **WAL Mode**: Enabled for better concurrency (`PRAGMA journal_mode = WAL`)
- **Key Tables**: transactions, notifications, alerts, config
- **Queries**: Organized in `lib/database/` with separate files per domain (`transactionQueries.ts`, `dashboardQueries.ts`, etc.)
- **Initialization**: Automatic table creation via `initializeDatabase()` function
- **Sync Configuration**: Stores sync intervals in minutes (10, 15, 30, 60) for better UX

### State Management Patterns

- **Database Context**: `useSQLiteContext()` hook provides direct SQLite access throughout components
- **Local Component State**: `useState` for UI state, `useCallback` for database operations
- **Data Fetching**: Async functions with Promise.all for parallel queries on dashboard

## Development Workflow

### Running the App

```bash
npm run dev          # Start Expo dev server
# Then press 'a' for Android emulator or scan QR for physical device
```

### Code Quality Tools

```bash
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
npm run type-check   # TypeScript compilation check
```

### Building & Deployment

- **EAS Build**: Configured in `eas.json` for Android-only deployment
- **Package**: `com.berlinbruno.moneytrail`
- **Permissions**: SMS access, background tasks, wake lock for continuous SMS monitoring

## Key Patterns & Conventions

### Folder Organization

- **lib/database/**: All database operations and queries (moved from `lib/db/`)
- **lib/sms/**: SMS processing pipeline (`backgroundTask.ts`, `sync.ts`, `parser.ts`)
- **utils/transactions/**: Transaction-specific utilities (`transactionParser.ts`, `filterUtils.ts`)
- **utils/finance/**: Financial calculations and insights (`insightsUtils.ts`)
- **utils/formatters.ts**: Consolidated formatting utilities (includes `cn` function)
- **contexts/AppProvider.tsx**: Unified context provider combining theme and settings

### Component Organization

- **UI Components**: `components/ui/` - Reusable UI primitives from `react-native-reusables`
- **Feature Components**: `components/{domain}/` - Domain-specific components (dashboard, transaction, alert, insights)
- **Styling**: TailwindCSS via NativeWind with dark/light theme support

### Type Definitions

- **Domain Types**: `types/` folder with TypeScript interfaces for core entities
- **Database Types**: Include `ID` and `Timestamp` from `types/Common.ts`
- **Transaction Types**: Extensive typing for categories, modes, sources, and states

### Database Patterns

- **Query Functions**: Return typed results, handle errors gracefully
- **Batch Operations**: Use transactions for multiple related database operations
- **Config Storage**: Key-value storage in `config` table for app settings and sync state

### SMS Processing Specifics

- **Finance Regex**: Comprehensive pattern matching banking keywords, UPI apps, and amount formats
- **Category Mapping**: Automatic categorization based on merchant/description keywords
- **Hash-based Deduplication**: Prevents processing same SMS multiple times
- **Background Sync**: Configurable intervals with error logging and performance metrics

## Critical Integration Points

### Permissions Flow

- **App Launch**: `utils/permissionUtils.ts` requests SMS permissions
- **Error Handling**: User-friendly alerts for permission denials
- **Background Tasks**: Require persistent permissions for SMS access

### Performance Considerations

- **SMS Filtering**: Use targeted regex to minimize irrelevant message processing
- **Database Indexing**: Ensure `sms_hash` and transaction dates are indexed
- **Memory Management**: Batch process large SMS collections to avoid memory issues
- **Background Limits**: Respect Android background execution limits

## Common Development Tasks

### Adding New Transaction Categories

1. Update `constants/transactionConstants.ts` with new category
2. Modify `categorizeTransaction()` in `lib/sms/sync.ts`
3. Update type definitions in `types/Transaction.ts`

### SMS Parser Improvements

- Test with `utils/transactions/transactionParser.ts` functions
- Focus on `parseTransactionFromSms()` for single transactions
- Handle multi-transaction SMS with `parseMultipleTransactionsFromSms()`
- Background task logic is in `lib/sms/backgroundTask.ts`

### Dashboard Data Sources

- Add new KPI calculations in `lib/database/dashboardQueries.ts`
- Update dashboard components in `components/dashboard/`
- Follow pattern of parallel data fetching with `Promise.all`

### Financial Insights & Analytics

- Calculation functions in `utils/finance/insightsUtils.ts`
- Chart data processing and trend analysis
- Category breakdown and spending pattern detection

### Background Task Debugging

- Check task registration status via `TaskManager.isTaskRegisteredAsync()`
- Monitor execution logs stored in `config` table
- Test task execution with `executeTask()` function directly
- Background task implementation in `lib/sms/backgroundTask.ts`

## File Organization Best Practices

### Import Path Patterns

- **Database Operations**: `@/lib/database/{queryFile}` (e.g., `@/lib/database/transactionQueries`)
- **SMS Processing**: `@/lib/sms/{module}` (e.g., `@/lib/sms/sync`, `@/lib/sms/backgroundTask`)
- **Utilities**: `@/utils/{category}/{file}` (e.g., `@/utils/transactions/transactionParser`, `@/utils/finance/insightsUtils`)
- **Formatters**: `@/utils/formatters` (consolidated formatting and `cn` utility)
- **UI Components**: `@/components/ui/{component}`
- **Feature Components**: `@/components/{domain}/{component}`

### Code Organization Principles

- **Feature-based Folders**: Group related functionality together
- **Single Responsibility**: Each file has a clear, focused purpose
- **Consistent Imports**: Use absolute imports with @ alias throughout
- **Type Safety**: Leverage TypeScript interfaces from `types/` folder
- **Database Consistency**: All queries use minute-based sync intervals
- **Context Consolidation**: Unified providers in `contexts/AppProvider.tsx`
