export function parseTransactionFromSms(message: string) {
  // Normalize string for easier matching
  // (removed unused 'normalized' variable)

  // Amount pattern: Rs / INR with optional .xx
  const amountMatch = message.match(/(?:inr|rs\.?)\s?(\d+(?:\.\d{1,2})?)/i);

  // Determine transaction type
  let type: 'debit' | 'credit' | 'unknown' = 'unknown';
  if (/debited/i.test(message)) {
    type = 'debit';
  } else if (/credited/i.test(message)) {
    type = 'credit';
  }

  // Optional: extract balance if present
  const balanceMatch = message.match(/bal[:\s]?\s?(\d+(?:\.\d{1,2})?)/i);

  return {
    amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
    type,
    balance: balanceMatch ? parseFloat(balanceMatch[1]) : null,
    raw: message,
  };
}

export function parseMultipleTransactionsFromSms(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();

  // Regex pattern to capture individual transactions
  const txPattern = /(?:rs\.?|inr)\s?(\d+(?:\.\d{1,2})?).*?(debited|credited)/gi;

  const matches = [...normalized.matchAll(txPattern)];

  const transactions = matches.map((match) => {
    const amount = parseFloat(match[1]);
    const type = match[2].toLowerCase() === 'debited' ? 'debit' : 'credit';

    // Optional: try to extract balance after this transaction
    const balanceMatch = normalized
      .slice(match.index! + match[0].length)
      .match(/(?:acbal|avl bal|clrbal)[:\s]*([\d,]+(?:\.\d{1,2})?)/i);
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null;

    // Optional: extract account number (last 4 digits)
    const accountMatch = normalized
      .slice(0, match.index! + match[0].length)
      .match(/(?:a\/c|acct|account)[^\d]*(\d{4,})/i);
    const account = accountMatch ? accountMatch[1] : null;

    // Optional: detect payee/payer name
    const payeeMatch =
      normalized
        .slice(0, match.index! + match[0].length)
        .match(/from\s([A-Z\s\.]+?)(?:[-,]|\.|$)/i) ||
      normalized
        .slice(0, match.index! + match[0].length)
        .match(/credited to\s([A-Z\s\.]+?)(?:[-,]|\.|$)/i);
    const payee = payeeMatch ? payeeMatch[1].trim() : null;

    return {
      amount,
      type,
      balance,
      account,
      payee,
      raw: match[0],
    };
  });

  return transactions;
}
