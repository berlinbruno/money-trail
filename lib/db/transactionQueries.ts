import { EditTransaction, NewTransaction, Transaction } from '@/types/Transaction'; // adjust import as needed
import { SQLiteDatabase } from 'expo-sqlite';

export async function getTransactions(
  db: SQLiteDatabase,
  {
    type = 'all',
    category = 'all',
    search = '',
    startDate = null,
    endDate = null,
    sortBy = 'date',
    sortOrder = 'desc',
    flaggedOnly = false, // new optional param
  }: {
    type?: 'all' | 'credit' | 'debit';
    category?: string;
    search?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
    flaggedOnly?: boolean; // optional boolean
  } = {}
): Promise<Transaction[]> {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (type !== 'all') {
    query += ' AND type = ?';
    params.push(type);
  }

  if (category !== 'all') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  if (search.trim()) {
    query += ' AND LOWER(title) LIKE ?';
    params.push(`%${search.toLowerCase()}%`);
  }

  if (startDate && endDate) {
    query += ' AND date >= ? AND date <= ?';
    params.push(startDate.toISOString(), endDate.toISOString());
  }

  if (flaggedOnly) {
    query += ' AND pending_approval = 1';
  } else {
    query += ' AND pending_approval = 0';
  }

  query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

  return db.getAllAsync(query, ...params);
}

export async function insertTransaction(db: SQLiteDatabase, newTransaction: NewTransaction) {
  await db.runAsync(
    `INSERT INTO transactions 
      (title, amount, category, type, date, account, mode, created_at, pending_approval, sms_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newTransaction.title,
      newTransaction.amount,
      newTransaction.category,
      newTransaction.type,
      newTransaction.date,
      newTransaction.account,
      newTransaction.mode,
      newTransaction.created_at,
      newTransaction.pending_approval,
      newTransaction.sms_hash, // now matches the column
    ]
  );
}

export async function updateTransaction(
  db: SQLiteDatabase,
  updatedTransaction: EditTransaction
): Promise<void> {
  await db.runAsync(
    'UPDATE transactions SET title = ?, amount = ?, category = ?, mode = ?, type = ?, date = ? WHERE id = ?',
    [
      updatedTransaction.title,
      updatedTransaction.amount,
      updatedTransaction.category,
      updatedTransaction.mode,
      updatedTransaction.type,
      updatedTransaction.date,
      updatedTransaction.id,
    ]
  );
}

export async function updateTransactionFlag(
  db: SQLiteDatabase,
  id: string,
  flag: 0 | 1
): Promise<void> {
  await db.runAsync('UPDATE transactions SET pending_approval = ? WHERE id = ?', [flag, id]);
}

export async function updateAllTransactionFlags(db: SQLiteDatabase, flag: 0 | 1): Promise<void> {
  await db.runAsync('UPDATE transactions SET pending_approval = ?', [flag]);
}

export async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}
