import { NewTransaction, TransactionCategory, TransactionSource } from '@/types/Transaction';
import { parseTransactionFromSms } from '@/utils/transactionParser';
import { MD5 } from 'crypto-js';
import { SQLiteDatabase } from 'expo-sqlite';
import SmsAndroid from 'react-native-get-sms-android';
import { getConfig, setConfig } from './db/configQueries';
import { insertTransaction } from './db/transactionQueries';

/**
 * Comprehensive finance regex
 */
const financeRegex =
  '(.*)(' +
  'debited|credited|upi|transaction|txn|payment|transferred|withdrawn|paid|received|' +
  'refund|reversal|collect|acbal|clrbal|balance|loan|emi|reward|cashback|' +
  'hdfc|icici|sbi|axis|kotak|yes bank|indusind|pnbs|canara bank|bank of baroda|union bank|' +
  'google pay|phonepe|paytm|bhim|mobikwik|amazon pay|freecharge|' +
  'credit card|debit card|card ending|cc ending|' +
  'rs|inr' +
  ')(.*)';

/**
 * Fetch finance-related inbox SMS
 */
export async function getFinanceInboxMessages(maxCount = 20) {
  return new Promise<{ _id: string; address: string; body: string; date: number }[]>(
    (resolve, reject) => {
      const filter: any = { box: 'inbox', maxCount, bodyRegex: financeRegex };
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail) => reject(new Error(fail)),
        (count, smsList) => resolve(JSON.parse(smsList))
      );
    }
  );
}

/**
 * Fetch finance-related inbox SMS (optionally by date)
 */
export async function getFinanceInboxMessagesByDateRange(
  startDate?: number,
  endDate?: number,
  maxCount = 100
) {
  return new Promise<{ _id: string; address: string; body: string; date: number }[]>(
    (resolve, reject) => {
      const filter: any = { box: 'inbox', maxCount, bodyRegex: financeRegex };
      if (startDate) filter.minDate = startDate;
      if (endDate) filter.maxDate = endDate;

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail) => reject(new Error(fail)),
        (count, smsList) => resolve(JSON.parse(smsList))
      );
    }
  );
}

/**
 * Generate SMS hash for deduplication
 */
export function getSmsHash(sms: { address: string; body: string; date: number }) {
  return MD5(`${sms.address}|${sms.body}|${sms.date}`).toString();
}

/**
 * Map SMS to a category
 */
export function categorizeTransaction(message: string): TransactionCategory {
  const text = message.toLowerCase();
  const categoryMap: Record<TransactionCategory, string[]> = {
    food: ['restaurant', 'food', 'cafe', 'dominos', 'pizza', 'meal'],
    grocery: ['supermarket', 'grocery', 'bigbasket', 'store', 'mart'],
    bills: ['electricity', 'water', 'bill', 'phone', 'internet', 'gas'],
    shopping: ['flipkart', 'amazon', 'shopping', 'myntra', 'ajio'],
    travel: ['uber', 'ola', 'train', 'flight', 'ticket', 'bus'],
    fuel: ['petrol', 'fuel', 'gas station', 'bp', 'shell'],
    rent: ['rent', 'apartment', 'flat'],
    salary: ['salary', 'payroll', 'credit salary'],
    investments: ['mutual fund', 'sip', 'investment', 'shares', 'stock'],
    refund: ['refund', 'reversal', 'credited back'],
    other: [],
  };

  for (const [category, keywords] of Object.entries(categoryMap) as [
    TransactionCategory,
    string[],
  ][]) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return 'other';
}

/**
 * Insert a single SMS as transaction
 */
export async function insertSmsTransaction(
  db: SQLiteDatabase,
  sms: { address: string; body: string; date: number },
  defaultAccount = 'default',
  approval: 0 | 1 = 1,
  source: TransactionSource = 'sms'
): Promise<NewTransaction | null> {
  const parsed = parseTransactionFromSms(sms.body);
  if (!parsed.amount || parsed.type === 'unknown') return null;

  const smsHash = getSmsHash(sms);
  const existing = await db.getFirstAsync(`SELECT id FROM transactions WHERE sms_hash=?`, [
    smsHash,
  ]);
  if (existing) return null;

  const transaction: NewTransaction = {
    title: sms.address,
    amount: parsed.amount,
    category: categorizeTransaction(sms.body),
    type: parsed.type,
    date: new Date(sms.date).toISOString(),
    account: defaultAccount,
    mode: 'other',
    created_at: new Date().toISOString(),
    pending_approval: approval,
    source,
    sms_hash: smsHash,
  };

  await insertTransaction(db, transaction);
  return transaction;
}

/**
 * Batch insert SMS messages
 */
export async function insertSmsBatch(
  db: SQLiteDatabase,
  messages: { address: string; body: string; date: number }[],
  defaultAccount = 'default',
  approval: 0 | 1 = 1,
  source: TransactionSource = 'sms'
) {
  const results: NewTransaction[] = [];
  for (const sms of messages) {
    const inserted = await insertSmsTransaction(db, sms, defaultAccount, approval, source);
    if (inserted) results.push(inserted);
  }
  return results;
}

/**
 * Main sync function
 */
export async function insertTransactions(db: SQLiteDatabase) {
  try {
    const lastSyncStr = await getConfig(db, 'lastSmsSync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
    const now = new Date();

    const inbox = await getFinanceInboxMessagesByDateRange(
      lastSync ? lastSync.getTime() : undefined,
      now.getTime(),
      200
    );

    const inserted = await insertSmsBatch(db, inbox, 'default', 1, 'sms');

    if (inserted.length > 0) {
      await setConfig(db, 'lastSmsSync', now.toISOString());
    }
  } catch (err) {
    console.error('Failed to insert SMS transactions:', err);
  }
}
