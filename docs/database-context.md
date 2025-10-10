# Database Context Documentation

Complete guide to Money Trail's SQLite database context and query patterns.

## Overview

The Database Context provides SQLite database access throughout the app using Expo SQLite with Write-Ahead Logging (WAL) mode for better concurrency. All database operations are organized in domain-specific query files with full TypeScript support.

## Architecture

```text
Database Layer
├── expo-sqlite (Core)
├── useSQLiteContext() (Hook)
├── lib/db/ (Query Files)
│   ├── db.ts (Initialization)
│   ├── transactionQueries.ts
│   ├── dashboardQueries.ts
│   ├── alertQueries.ts
│   ├── configQueries.ts
│   └── ...
└── types/ (TypeScript Definitions)
```

## Database Setup

### Location and Configuration

- **File**: `assets/database/app.db` (bundled with app)
- **Mode**: WAL (Write-Ahead Logging) for better concurrency
- **Access**: Direct SQLite access via `useSQLiteContext()`
- **Initialization**: Automatic table creation on first run

### Key Tables

| Table           | Purpose                | Key Columns                            |
| --------------- | ---------------------- | -------------------------------------- |
| `transactions`  | Financial transactions | id, amount, type, category, timestamp  |
| `notifications` | App notifications      | id, title, message, type, read_status  |
| `alerts`        | User-defined alerts    | id, name, condition, threshold, active |
| `config`        | App configuration      | key, value, updated_at                 |
| `app_logs`      | Application logs       | id, level, message, timestamp          |

## Basic Usage

### Accessing Database

```typescript
import { useSQLiteContext } from 'expo-sqlite';

const MyComponent = () => {
  const db = useSQLiteContext();

  // Use db for queries
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await getRecentTransactions(db, 10);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };
};
```

### Query File Import Pattern

```typescript
// Import specific query functions
import {
  getRecentTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/db/transactionQueries';

import { getDashboardStats, getMonthlyTrends } from '@/lib/db/dashboardQueries';

import { getActiveAlerts, createAlert } from '@/lib/db/alertQueries';
```

## Query Patterns

### Data Fetching

```typescript
const useTransactionData = () => {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentTransactions(db, 50);
      setTransactions(data);
    } catch (err) {
      console.error('Load transactions failed:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return { transactions, loading, error, refresh: loadTransactions };
};
```

### Data Mutation

```typescript
const useTransactionMutations = () => {
  const db = useSQLiteContext();
  const { showToast } = useToast();

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
      try {
        const id = await insertTransaction(db, {
          ...transaction,
          createdAt: new Date().toISOString(),
        });
        showToast('Transaction added successfully');
        return id;
      } catch (error) {
        console.error('Add transaction failed:', error);
        showToast('Failed to add transaction');
        throw error;
      }
    },
    [db, showToast]
  );

  const updateTransactionData = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      try {
        await updateTransaction(db, id, updates);
        showToast('Transaction updated');
      } catch (error) {
        console.error('Update transaction failed:', error);
        showToast('Failed to update transaction');
        throw error;
      }
    },
    [db, showToast]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      try {
        await deleteTransaction(db, id);
        showToast('Transaction deleted');
      } catch (error) {
        console.error('Delete transaction failed:', error);
        showToast('Failed to delete transaction');
        throw error;
      }
    },
    [db, showToast]
  );

  return {
    addTransaction,
    updateTransaction: updateTransactionData,
    removeTransaction,
  };
};
```

### Parallel Data Loading

```typescript
const useDashboardData = () => {
  const db = useSQLiteContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load multiple data sets in parallel
      const [recentTransactions, monthlyStats, activeAlerts, unreadNotifications, appConfig] =
        await Promise.all([
          getRecentTransactions(db, 10),
          getMonthlyStats(db),
          getActiveAlerts(db),
          getUnreadNotifications(db),
          getAppConfig(db),
        ]);

      setData({
        recentTransactions,
        monthlyStats,
        activeAlerts,
        unreadNotifications,
        appConfig,
      });
    } catch (error) {
      console.error('Dashboard data load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return { data, loading, refresh: loadDashboardData };
};
```

## Query File Organization

### Transaction Queries (`lib/db/transactionQueries.ts`)

```typescript
export const getRecentTransactions = async (
  db: SQLiteDatabase,
  limit: number = 10
): Promise<Transaction[]> => {
  const result = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return result;
};

export const insertTransaction = async (
  db: SQLiteDatabase,
  transaction: Omit<Transaction, 'id'>
): Promise<string> => {
  const result = await db.runAsync(
    `INSERT INTO transactions (amount, type, category, description, timestamp) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      transaction.amount,
      transaction.type,
      transaction.category,
      transaction.description,
      transaction.timestamp,
    ]
  );
  return result.lastInsertRowId.toString();
};

export const updateTransaction = async (
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Transaction>
): Promise<void> => {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);

  await db.runAsync(`UPDATE transactions SET ${fields} WHERE id = ?`, [...values, id]);
};

export const deleteTransaction = async (db: SQLiteDatabase, id: string): Promise<void> => {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};
```

### Dashboard Queries (`lib/db/dashboardQueries.ts`)

```typescript
export const getDashboardStats = async (db: SQLiteDatabase): Promise<DashboardStats> => {
  const [totalIncome, totalExpense, transactionCount] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "credit"'
    ),
    db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "debit"'
    ),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions'),
  ]);

  return {
    totalIncome: totalIncome?.total || 0,
    totalExpense: totalExpense?.total || 0,
    transactionCount: transactionCount?.count || 0,
    netBalance: (totalIncome?.total || 0) - (totalExpense?.total || 0),
  };
};
```

### Config Queries (`lib/db/configQueries.ts`)

```typescript
export const getConfigValue = async (db: SQLiteDatabase, key: string): Promise<string | null> => {
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    [key]
  );
  return result?.value || null;
};

export const setConfigValue = async (
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> => {
  await db.runAsync(
    `INSERT OR REPLACE INTO config (key, value, updated_at) 
     VALUES (?, ?, datetime('now'))`,
    [key, value]
  );
};
```

## Transaction Management

### Database Transactions

```typescript
const performBulkOperation = async (db: SQLiteDatabase, operations: Operation[]) => {
  await db.withTransactionAsync(async () => {
    for (const operation of operations) {
      switch (operation.type) {
        case 'insert':
          await insertTransaction(db, operation.data);
          break;
        case 'update':
          await updateTransaction(db, operation.id, operation.data);
          break;
        case 'delete':
          await deleteTransaction(db, operation.id);
          break;
      }
    }
  });
};
```

### Batch Operations

```typescript
const importTransactions = async (
  db: SQLiteDatabase,
  transactions: Transaction[]
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const stmt = await db.prepareAsync(
      'INSERT INTO transactions (amount, type, category, description, timestamp) VALUES (?, ?, ?, ?, ?)'
    );

    try {
      for (const transaction of transactions) {
        await stmt.executeAsync([
          transaction.amount,
          transaction.type,
          transaction.category,
          transaction.description,
          transaction.timestamp,
        ]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
};
```

## Error Handling

### Query Error Patterns

```typescript
const safeQuery = async <T>(
  queryFn: () => Promise<T>,
  fallback: T,
  errorMessage: string = 'Query failed'
): Promise<T> => {
  try {
    return await queryFn();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
};

// Usage
const transactions = await safeQuery(
  () => getRecentTransactions(db, 10),
  [],
  'Failed to load recent transactions'
);
```

### Connection Error Handling

```typescript
const useDatabaseConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db = useSQLiteContext();

  useEffect(() => {
    const testConnection = async () => {
      try {
        await db.execAsync('SELECT 1');
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError('Database connection failed');
        console.error('Database connection test failed:', err);
      }
    };

    testConnection();
  }, [db]);

  return { isConnected, error };
};
```

## Performance Optimization

### Query Optimization

```typescript
// ✅ Good - Use indexes and LIMIT
const getTransactionsByCategory = async (
  db: SQLiteDatabase,
  category: string,
  limit: number = 50
): Promise<Transaction[]> => {
  return await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE category = ? ORDER BY timestamp DESC LIMIT ?',
    [category, limit]
  );
};

// ✅ Good - Use prepared statements for repeated queries
const useTransactionUpdater = () => {
  const db = useSQLiteContext();
  const [updateStmt, setUpdateStmt] = useState<SQLiteStatement | null>(null);

  useEffect(() => {
    const prepareStatement = async () => {
      const stmt = await db.prepareAsync(
        'UPDATE transactions SET amount = ?, category = ? WHERE id = ?'
      );
      setUpdateStmt(stmt);
    };

    prepareStatement();

    return () => {
      updateStmt?.finalizeAsync();
    };
  }, [db]);

  const updateTransaction = useCallback(
    async (id: string, amount: number, category: string) => {
      if (updateStmt) {
        await updateStmt.executeAsync([amount, category, id]);
      }
    },
    [updateStmt]
  );

  return { updateTransaction };
};
```

### Connection Pooling

```typescript
const useDatabasePool = () => {
  const db = useSQLiteContext();

  // Reuse connections efficiently
  const executeQuery = useCallback(
    async <T>(query: string, params: any[] = []): Promise<T[]> => {
      return await db.getAllAsync<T>(query, params);
    },
    [db]
  );

  return { executeQuery };
};
```

## Best Practices

### 1. Use TypeScript Types

```typescript
// ✅ Good - Full type safety
interface TransactionQueryResult {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  timestamp: string;
}

const getTypedTransactions = async (db: SQLiteDatabase): Promise<TransactionQueryResult[]> => {
  return await db.getAllAsync<TransactionQueryResult>(
    'SELECT id, amount, type, category, timestamp FROM transactions'
  );
};

// ❌ Bad - No type safety
const getUntypedTransactions = async (db: SQLiteDatabase): Promise<any[]> => {
  return await db.getAllAsync('SELECT * FROM transactions');
};
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good - Comprehensive error handling
const safeGetTransactions = async (db: SQLiteDatabase): Promise<Transaction[]> => {
  try {
    return await getRecentTransactions(db);
  } catch (error) {
    console.error('Failed to get transactions:', error);

    if (error.code === 'SQLITE_BUSY') {
      // Retry after short delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await getRecentTransactions(db);
    }

    return []; // Return empty array as fallback
  }
};
```

### 3. Use Transactions for Related Operations

```typescript
// ✅ Good - Atomic operations
const transferTransaction = async (
  db: SQLiteDatabase,
  fromAccount: string,
  toAccount: string,
  amount: number
) => {
  await db.withTransactionAsync(async () => {
    // Debit from source
    await insertTransaction(db, {
      account: fromAccount,
      amount: -amount,
      type: 'debit',
      description: `Transfer to ${toAccount}`,
    });

    // Credit to destination
    await insertTransaction(db, {
      account: toAccount,
      amount: amount,
      type: 'credit',
      description: `Transfer from ${fromAccount}`,
    });
  });
};
```

### 4. Optimize with LIMIT and Pagination

```typescript
// ✅ Good - Paginated queries
const getPaginatedTransactions = async (
  db: SQLiteDatabase,
  page: number,
  pageSize: number = 20
): Promise<{ transactions: Transaction[]; hasMore: boolean }> => {
  const offset = page * pageSize;

  const [transactions, totalCount] = await Promise.all([
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [pageSize + 1, offset]
    ),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions'),
  ]);

  const hasMore = transactions.length > pageSize;
  if (hasMore) {
    transactions.pop(); // Remove extra item
  }

  return {
    transactions,
    hasMore,
  };
};
```

### 5. Use Prepared Statements for Repeated Queries

```typescript
// ✅ Good - Prepared statements for performance
const useBulkTransactionInserter = () => {
  const db = useSQLiteContext();

  const insertMultipleTransactions = useCallback(
    async (transactions: Omit<Transaction, 'id'>[]) => {
      const stmt = await db.prepareAsync(
        'INSERT INTO transactions (amount, type, category, timestamp) VALUES (?, ?, ?, ?)'
      );

      try {
        await db.withTransactionAsync(async () => {
          for (const transaction of transactions) {
            await stmt.executeAsync([
              transaction.amount,
              transaction.type,
              transaction.category,
              transaction.timestamp,
            ]);
          }
        });
      } finally {
        await stmt.finalizeAsync();
      }
    },
    [db]
  );

  return { insertMultipleTransactions };
};
```

## Common Patterns

### Dashboard Data Loading

```typescript
const useDashboard = () => {
  const db = useSQLiteContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

      const [stats, recentTransactions, monthlyTrends, alerts] = await Promise.all([
        getDashboardStats(db),
        getRecentTransactions(db, 5),
        getMonthlyTrends(db),
        getActiveAlerts(db),
      ]);

      setData({ stats, recentTransactions, monthlyTrends, alerts });
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return { data, loading, refresh: refreshData };
};
```

### Real-time Data Updates

```typescript
const useRealtimeTransactions = () => {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshTransactions = useCallback(async () => {
    const latest = await getRecentTransactions(db, 50);
    setTransactions(latest);
  }, [db]);

  // Refresh when database changes (implement custom listener)
  useEffect(() => {
    const interval = setInterval(refreshTransactions, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refreshTransactions]);

  return { transactions, refresh: refreshTransactions };
};
```

## TypeScript Types

```typescript
import { SQLiteDatabase } from 'expo-sqlite';

// Query result types
interface QueryResult<T = any> {
  data: T[];
  success: boolean;
  error?: string;
}

// Common query function type
type QueryFunction<T> = (db: SQLiteDatabase, ...args: any[]) => Promise<T>;

// Mutation function type
type MutationFunction<T = void> = (db: SQLiteDatabase, ...args: any[]) => Promise<T>;

// Database hook return type
interface DatabaseHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

## Migration and Maintenance

### Database Migrations

```typescript
const runMigrations = async (db: SQLiteDatabase) => {
  const currentVersion = (await getConfigValue(db, 'schema_version')) || '0';

  if (currentVersion < '1') {
    // Migration to version 1
    await db.execAsync(`
      ALTER TABLE transactions 
      ADD COLUMN description TEXT DEFAULT ''
    `);
    await setConfigValue(db, 'schema_version', '1');
  }

  if (currentVersion < '2') {
    // Migration to version 2
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
      ON transactions(timestamp)
    `);
    await setConfigValue(db, 'schema_version', '2');
  }
};
```

### Database Maintenance

```typescript
const performMaintenance = async (db: SQLiteDatabase) => {
  try {
    // Vacuum database to reclaim space
    await db.execAsync('VACUUM');

    // Analyze tables for query optimization
    await db.execAsync('ANALYZE');

    // Update maintenance timestamp
    await setConfigValue(db, 'last_maintenance', new Date().toISOString());

    console.log('Database maintenance completed');
  } catch (error) {
    console.error('Database maintenance failed:', error);
  }
};
```
