import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

/**
 * Database connection manager for handling concurrent access
 * Provides retry mechanisms and proper connection configuration
 */
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private connections: Map<string, SQLiteDatabase> = new Map();

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Open a database connection with proper configuration
   */
  async openConnection(
    connectionId: string,
    dbName: string = 'app.db',
    options: {
      enableChangeListener?: boolean;
      busyTimeout?: number;
      retryAttempts?: number;
    } = {}
  ): Promise<SQLiteDatabase> {
    const {
      enableChangeListener = true,
      busyTimeout = 30000, // 30 seconds
      retryAttempts = 3,
    } = options;

    // Check if connection already exists
    if (this.connections.has(connectionId)) {
      return this.connections.get(connectionId)!;
    }

    let db: SQLiteDatabase | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        db = await openDatabaseAsync(dbName, {
          enableChangeListener,
        });

        // Configure database for concurrent access
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync(`PRAGMA busy_timeout = ${busyTimeout};`);

        // For background tasks, use NORMAL synchronous mode for better performance
        if (!enableChangeListener) {
          await db.execAsync('PRAGMA synchronous = NORMAL;');
        }

        // Store connection
        this.connections.set(connectionId, db);

        console.log(`Database connection opened: ${connectionId}`);
        return db;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (attempt < retryAttempts) {
          console.log(
            `Database connection failed, retrying (attempt ${attempt}/${retryAttempts}):`,
            errorMessage
          );
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
          continue;
        }

        throw new Error(
          `Failed to open database connection after ${retryAttempts} attempts: ${errorMessage}`
        );
      }
    }

    throw new Error('Unexpected error in database connection');
  }

  /**
   * Close a database connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    const db = this.connections.get(connectionId);
    if (db) {
      try {
        await db.closeAsync();
        this.connections.delete(connectionId);
        console.log(`Database connection closed: ${connectionId}`);
      } catch (error) {
        console.error(`Error closing database connection ${connectionId}:`, error);
        // Remove from map even if close failed to prevent memory leaks
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * Get an existing connection
   */
  getConnection(connectionId: string): SQLiteDatabase | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Execute a database operation with retry logic
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryAttempts: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if it's a database busy error
        const isBusyError =
          errorMessage.includes('database is locked') ||
          errorMessage.includes('SQLITE_BUSY') ||
          errorMessage.includes('database is busy');

        if (isBusyError && attempt < retryAttempts) {
          console.log(
            `Database busy, retrying ${operationName} (attempt ${attempt}/${retryAttempts})`
          );
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
          continue;
        }

        // If not a retry-able error or max attempts reached, throw
        throw error;
      }
    }
    throw new Error(`Failed after ${retryAttempts} attempts`);
  }

  /**
   * Close all connections (for app shutdown)
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map((id) => this.closeConnection(id));
    await Promise.all(closePromises);
  }
}

// Export singleton instance
export const dbConnectionManager = DatabaseConnectionManager.getInstance();
