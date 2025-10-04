import { NewTransaction, TransactionCategory, TransactionSource } from '@/types/Transaction';
import { getSmsHash } from '@/utils/cryptoUtils';
import { SQLiteDatabase } from 'expo-sqlite';
import SmsAndroid from 'react-native-get-sms-android';
import { logError, logInfo } from '../database/loggingQueries';
import { getAutoApproval, getLastSyncTime, setLastSyncTime } from '../database/settingsQueries';
import { insertTransaction } from '../database/transactionQueries';
import { parseTransactionFromSms } from './parser';

// Enhanced types for better SMS processing
export interface SyncResult {
  success: boolean;
  processed: number;
  inserted: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
  executionTime: number;
}

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
        (count, smsList) => {
          const messages = JSON.parse(smsList);
          console.log(
            `SMS Fetch: Retrieved ${messages.length} finance messages (max: ${maxCount})`
          );
          resolve(messages);
        }
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
        (count, smsList) => {
          const messages = JSON.parse(smsList);
          console.log(
            `SMS Fetch: Retrieved ${messages.length} finance messages by date range (max: ${maxCount})`
          );
          resolve(messages);
        }
      );
    }
  );
}

/**
 * Generate SMS hash for deduplication
 */
async function generateSmsHash(sms: {
  address: string;
  body: string;
  date: number;
}): Promise<string> {
  return await getSmsHash(sms.body, `${sms.address}|${sms.date}`);
}

/**
 * Enhanced transaction categorization with comprehensive keyword matching
 * Uses multiple strategies: exact keywords, partial matches, and merchant patterns
 */
export function categorizeTransaction(message: string): TransactionCategory {
  const text = message.toLowerCase();

  // Enhanced category mapping with comprehensive keywords
  const categoryMap: Record<TransactionCategory, string[]> = {
    food: [
      // Restaurants & Food Delivery
      'restaurant',
      'food',
      'cafe',
      'coffee',
      'dining',
      'meal',
      'breakfast',
      'lunch',
      'dinner',
      'dominos',
      'pizza hut',
      'pizza',
      'burger',
      'kfc',
      'mcdonalds',
      'subway',
      'starbucks',
      'zomato',
      'swiggy',
      'foodpanda',
      'uber eats',
      'grubhub',
      'delivery',
      // Indian food chains
      'haldirams',
      'bikanervala',
      'sagar ratna',
      'saravana bhavan',
      'udupi',
      // Generic food terms
      'bakery',
      'sweet shop',
      'ice cream',
      'juice',
      'tea',
      'snacks',
      'canteen',
    ],

    grocery: [
      // Supermarkets & Grocery stores
      'supermarket',
      'grocery',
      'store',
      'mart',
      'bazaar',
      'market',
      'provisions',
      'bigbasket',
      'grofers',
      'amazon fresh',
      'reliance fresh',
      'more',
      'spencer',
      'dmart',
      'easyday',
      'vishal mega mart',
      'hypercity',
      'star bazaar',
      // Local terms
      'kirana',
      'general store',
      'departmental store',
      'wholesale',
      'vegetables',
      'fruits',
      'dairy',
      'milk',
      'bread',
      'rice',
      'wheat',
      'oil',
      'spices',
    ],

    bills: [
      // Utilities
      'electricity',
      'electric bill',
      'power bill',
      'bescom',
      'kseb',
      'mseb',
      'pseb',
      'water bill',
      'water tax',
      'sewerage',
      'drainage',
      'gas bill',
      'lpg',
      'cylinder',
      'indane',
      'bharat gas',
      'hp gas',
      // Telecom
      'phone bill',
      'mobile bill',
      'recharge',
      'prepaid',
      'postpaid',
      'airtel',
      'jio',
      'vi',
      'idea',
      'vodafone',
      'bsnl',
      'mtnl',
      'internet bill',
      'broadband',
      'wifi',
      'fiber',
      'data',
      // Other bills
      'bill payment',
      'utility',
      'municipal',
      'property tax',
      'house tax',
      'maintenance',
      'society charges',
      'club membership',
    ],

    shopping: [
      // E-commerce
      'flipkart',
      'amazon',
      'myntra',
      'ajio',
      'nykaa',
      'jabong',
      'snapdeal',
      'meesho',
      'shopclues',
      'paytm mall',
      'tata cliq',
      'reliance trends',
      // Fashion & Lifestyle
      'shopping',
      'clothing',
      'fashion',
      'apparel',
      'shoes',
      'footwear',
      'accessories',
      'jewelry',
      'cosmetics',
      'beauty',
      'perfume',
      // Electronics
      'electronics',
      'mobile',
      'laptop',
      'computer',
      'gadget',
      'appliance',
      'croma',
      'reliance digital',
      'vijay sales',
      'poorvika',
      'sangeetha mobiles',
      // Department stores
      'lifestyle',
      'max fashion',
      'pantaloons',
      'westside',
      'central',
      'shoppers stop',
    ],

    travel: [
      // Transportation
      'uber',
      'ola',
      'rapido',
      'auto',
      'taxi',
      'cab',
      'rickshaw',
      'bus',
      'volvo',
      'ksrtc',
      'apsrtc',
      'msrtc',
      'redbus',
      'abhibus',
      'train',
      'railway',
      'irctc',
      'tatkal',
      'reservation',
      'platform ticket',
      'flight',
      'airline',
      'indigo',
      'spicejet',
      'air india',
      'vistara',
      'goair',
      'makemytrip',
      'cleartrip',
      'yatra',
      'goibibo',
      'easemytrip',
      // Other travel
      'hotel',
      'booking',
      'accommodation',
      'oyo',
      'treebo',
      'fab hotels',
      'travel',
      'tour',
      'ticket',
      'parking',
      'toll',
      'metro',
      'local train',
    ],

    fuel: [
      // Fuel stations
      'petrol',
      'diesel',
      'fuel',
      'gas station',
      'filling station',
      'bp',
      'shell',
      'hp petrol',
      'iocl',
      'bharat petroleum',
      'hindustan petroleum',
      'reliance petrol',
      'essar',
      'nayara energy',
      // Related terms
      'pump',
      'bunk',
      'cng',
      'lpg cylinder',
      'auto fuel',
    ],

    rent: [
      // Housing
      'rent',
      'rental',
      'apartment',
      'flat',
      'house rent',
      'room rent',
      'pg',
      'paying guest',
      'hostel',
      'accommodation rent',
      'lease',
      'deposit',
      'advance rent',
      'monthly rent',
      // Property related
      'property',
      'real estate',
      'housing',
      'residence',
    ],

    salary: [
      // Income sources
      'salary',
      'payroll',
      'credit salary',
      'sal credit',
      'wages',
      'income',
      'bonus',
      'incentive',
      'commission',
      'allowance',
      'reimbursement',
      'freelance',
      'consultant fee',
      'professional fee',
      'honorarium',
      // Employment terms
      'employment',
      'job',
      'work',
      'office',
      'company credit',
    ],

    investments: [
      // Investment types
      'mutual fund',
      'mf',
      'sip',
      'systematic investment',
      'investment',
      'shares',
      'equity',
      'stock',
      'trading',
      'demat',
      'portfolio',
      'zerodha',
      'groww',
      'upstox',
      'angel broking',
      'icicidirect',
      'hdfc securities',
      'kotak securities',
      'sharekhan',
      // Financial products
      'fd',
      'fixed deposit',
      'rd',
      'recurring deposit',
      'ppf',
      'elss',
      'nsc',
      'bonds',
      'gold',
      'insurance premium',
      'lic',
      'ulip',
    ],

    refund: [
      // Refund types
      'refund',
      'reversal',
      'credited back',
      'cashback',
      'reward',
      'return',
      'reimbursement',
      'adjustment',
      'correction',
      'cancelled',
      'failed transaction',
      'dispute resolved',
      'chargeback',
      'merchant refund',
      'partial refund',
    ],

    other: [],
  };

  // Enhanced matching strategy
  for (const [category, keywords] of Object.entries(categoryMap) as [
    TransactionCategory,
    string[],
  ][]) {
    // Skip empty category (other)
    if (keywords.length === 0) continue;

    // Check for keyword matches with word boundaries for better accuracy
    const hasMatch = keywords.some((keyword) => {
      // For single words, use word boundary matching
      if (!keyword.includes(' ')) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(text);
      }
      // For phrases, use includes matching
      return text.includes(keyword);
    });

    if (hasMatch) return category;
  }

  // Additional pattern-based categorization for edge cases

  // Check for UPI merchant patterns (merchant@bank)
  if (
    text.includes('@') &&
    (text.includes('paytm') || text.includes('phonepe') || text.includes('gpay'))
  ) {
    // Analyze UPI transaction based on context
    if (text.includes('food') || text.includes('restaurant') || text.includes('cafe'))
      return 'food';
    if (text.includes('fuel') || text.includes('petrol')) return 'fuel';
    if (text.includes('grocery') || text.includes('store')) return 'grocery';
    return 'shopping'; // Default for UPI merchant transactions
  }

  // Check for bank-specific patterns
  if (text.includes('emi') || text.includes('loan')) return 'bills';
  if (text.includes('credit card bill') || text.includes('cc bill')) return 'bills';
  if (text.includes('atm') && text.includes('withdrawal')) return 'other';

  // Amount-based heuristics for common patterns
  const amountMatch = text.match(/(?:rs\.?\s*|inr\s*|₹\s*)(\d+(?:,\d+)*(?:\.\d{2})?)/i);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Large amounts might be rent or salary
    if (amount > 15000) {
      if (text.includes('credit') || text.includes('received')) return 'salary';
      if (text.includes('debit') || text.includes('paid')) return 'rent';
    }

    // Small amounts might be food or transport
    if (amount < 500) {
      if (text.includes('upi') || text.includes('payment')) return 'food';
    }
  }

  return 'other';
}

/**
 * Insert a single SMS as transaction
 */
export async function insertSmsTransaction(
  db: SQLiteDatabase,
  sms: { _id?: string; address: string; body: string; date: number },
  defaultAccount = 'default',
  forceApproval?: 0 | 1,
  source: TransactionSource = 'sms'
): Promise<NewTransaction | null> {
  try {
    const parsed = parseTransactionFromSms(sms.body);

    if (!parsed.amount || parsed.type === 'unknown') {
      return null;
    }

    const smsHash = await generateSmsHash(sms);
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM transactions WHERE sms_hash=?`,
      [smsHash]
    );

    if (existing) {
      return null;
    }

    // Determine approval status
    let pendingApproval: 0 | 1;
    if (forceApproval !== undefined) {
      // Use forced approval value
      pendingApproval = forceApproval;
    } else {
      // Check auto-approval setting
      const autoApproval = await getAutoApproval();
      pendingApproval = autoApproval ? 0 : 1;
    }

    // Categorize transaction
    const category = categorizeTransaction(sms.body);

    const transaction: NewTransaction = {
      title: sms.address,
      amount: parsed.amount,
      category,
      type: parsed.type,
      date: new Date(sms.date).toISOString(),
      account: defaultAccount,
      mode: 'other',
      created_at: new Date().toISOString(),
      pending_approval: pendingApproval,
      source,
      sms_hash: smsHash,
    };

    await insertTransaction(db, transaction);
    return transaction;
  } catch (error) {
    throw error;
  }
}

/**
 * Batch insert SMS messages
 */
export async function insertSmsBatch(
  db: SQLiteDatabase,
  messages: { _id?: string; address: string; body: string; date: number }[],
  defaultAccount = 'default',
  forceApproval?: 0 | 1,
  source: TransactionSource = 'sms'
) {
  const results: NewTransaction[] = [];
  const errors: { sms: any; error: string }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const sms = messages[i];
    try {
      const inserted = await insertSmsTransaction(db, sms, defaultAccount, forceApproval, source);
      if (inserted) {
        results.push(inserted);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ sms, error: errorMessage });
    }
  }

  return results;
}

/**
 * Main sync function with comprehensive error handling and reporting
 */
export async function syncTransactions(
  db: SQLiteDatabase,
  options: {
    maxMessages?: number;
    defaultAccount?: string;
    forceApproval?: 0 | 1; // Override auto-approval setting if needed
    retryAttempts?: number; // Number of retry attempts for database operations
  } = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const {
    maxMessages = 200,
    defaultAccount = 'default',
    forceApproval,
    retryAttempts = 3,
  } = options;
  const syncKey = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  // Retry mechanism for database operations
  const retryDatabaseOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    attempts = retryAttempts
  ): Promise<T> => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if it's a database busy error
        if (errorMessage.includes('database is locked') || errorMessage.includes('SQLITE_BUSY')) {
          if (attempt < attempts) {
            console.log(
              `Database busy, retrying ${operationName} (attempt ${attempt}/${attempts})`
            );
            // Exponential backoff: 100ms, 200ms, 400ms
            await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
            continue;
          }
        }

        // If not a retry-able error or max attempts reached, throw
        throw error;
      }
    }
    throw new Error(`Failed after ${attempts} attempts`);
  };

  try {
    // Log sync start with retry mechanism
    await retryDatabaseOperation(
      () =>
        logInfo(
          db,
          'sms_processing',
          'SMS sync started',
          `Starting SMS sync with maxMessages: ${maxMessages}`,
          {
            sync_key: syncKey,
            max_messages: maxMessages,
            default_account: defaultAccount,
            force_approval: forceApproval,
            start_time: new Date().toISOString(),
          }
        ),
      'log sync start'
    );

    // Get last sync time with retry
    const lastSync = await retryDatabaseOperation(() => getLastSyncTime(), 'get last sync time');
    const now = new Date();

    console.log('Starting SMS sync...', {
      lastSync: lastSync?.toISOString(),
      maxMessages,
      forceApproval: forceApproval !== undefined ? forceApproval : 'auto',
    });

    // Fetch messages
    const messages = await getFinanceInboxMessagesByDateRange(
      lastSync ? lastSync.getTime() : undefined,
      now.getTime(),
      maxMessages
    );

    if (messages.length === 0) {
      console.log('No new SMS messages to process');

      await logInfo(
        db,
        'sms_processing',
        'SMS sync completed - no messages',
        'No new messages found to process',
        {
          sync_key: syncKey,
          execution_time_ms: Date.now() - startTime,
        }
      );

      return {
        success: true,
        processed: 0,
        inserted: 0,
        duplicates: 0,
        errors: 0,
        errorMessages: [],
        executionTime: Date.now() - startTime,
      };
    }

    // Process messages with auto-approval handling and retry mechanism
    const results = await retryDatabaseOperation(
      () =>
        insertSmsBatch(
          db,
          messages,
          defaultAccount,
          forceApproval, // Will use auto-approval setting if undefined
          'sms'
        ),
      'insert SMS batch'
    );

    // Update last sync time if any messages were processed successfully
    if (results.length > 0) {
      await setLastSyncTime(now);
      console.log('Updated last sync time:', now.toISOString());

      // Log approval status for debugging
      const autoApproval =
        forceApproval !== undefined ? forceApproval === 0 : await getAutoApproval();
      console.log(
        `Inserted ${results.length} transactions with ${autoApproval ? 'auto-approval' : 'manual approval required'}`
      );
    }

    // Calculate sync statistics
    const duplicates = messages.length - results.length;
    const executionTime = Date.now() - startTime;

    const syncResult = {
      success: true,
      processed: messages.length,
      inserted: results.length,
      duplicates,
      errors: 0,
      errorMessages: [],
      executionTime,
    };

    // Log successful sync completion
    await logInfo(
      db,
      'sms_processing',
      'SMS sync completed successfully',
      `Processed ${messages.length} messages, created ${results.length} transactions`,
      {
        sync_key: syncKey,
        processed: messages.length,
        inserted: results.length,
        duplicates,
        execution_time_ms: executionTime,
        processing_rate:
          messages.length > 0 ? (messages.length / (executionTime / 1000)).toFixed(2) : 0,
        success_rate:
          messages.length > 0 ? ((results.length / messages.length) * 100).toFixed(2) : 100,
        last_sync_updated: results.length > 0,
      }
    );

    return syncResult;
  } catch (error) {
    console.error('Failed to sync SMS transactions:', error);

    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log sync failure
    await logError(db, 'sms_processing', 'SMS sync failed', errorMessage, {
      sync_key: syncKey,
      execution_time_ms: executionTime,
      error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      max_messages: maxMessages,
      default_account: defaultAccount,
    });

    return {
      success: false,
      processed: 0,
      inserted: 0,
      duplicates: 0,
      errors: 1,
      errorMessages: [errorMessage],
      executionTime,
    };
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function insertTransactions(db: SQLiteDatabase): Promise<void> {
  try {
    const result = await syncTransactions(db);
    console.log('Legacy insertTransactions completed:', result);
  } catch (error) {
    console.error('Failed to insert SMS transactions:', error);
    throw error;
  }
}
