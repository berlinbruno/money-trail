// utils/formatters.ts

/**
 * Format a number as currency with optional locale and currency type.
 * Defaults to Indian Rupees (INR).
 */
export function formatAmount(value: number | string, locale = 'en-IN', currency = 'INR'): string {
  let num: number;

  if (typeof value === 'string') {
    num = Number(value.trim());
    if (Number.isNaN(num)) {
      throw new Error(`Invalid numeric string: "${value}"`);
    }
  } else {
    num = value;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format amount with currency object (symbol, code)
 * This is the new preferred method for dynamic currency formatting
 */
export function formatAmountWithCurrency(
  value: number | string,
  currency: { code: string; symbol: string },
  locale?: string
): string {
  let num: number;

  if (typeof value === 'string') {
    num = Number(value.trim());
    if (Number.isNaN(num)) {
      throw new Error(`Invalid numeric string: "${value}"`);
    }
  } else {
    num = value;
  }

  // Use appropriate locale based on currency
  const defaultLocale = getLocaleForCurrency(currency.code);
  const finalLocale = locale || defaultLocale;

  try {
    // Try using Intl.NumberFormat with the currency code first
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  } catch (error) {
    // Fallback: format as number and prepend symbol
    console.warn(`Currency formatting failed for ${currency.code}, using fallback`, error);
    const formattedNumber = new Intl.NumberFormat(finalLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
    return `${currency.symbol}${formattedNumber}`;
  }
}

/**
 * Get appropriate locale for a currency code
 */
function getLocaleForCurrency(currencyCode: string): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    EUR: 'en-EU',
    GBP: 'en-GB',
    INR: 'en-IN',
    JPY: 'ja-JP',
    CAD: 'en-CA',
    AUD: 'en-AU',
    CNY: 'zh-CN',
  };
  return localeMap[currencyCode] || 'en-US';
}

/**
 * Simple amount formatting with just the symbol (for cases where we need custom control)
 */
export function formatAmountWithSymbol(
  value: number | string,
  symbol: string,
  locale = 'en-IN'
): string {
  let num: number;

  if (typeof value === 'string') {
    num = Number(value.trim());
    if (Number.isNaN(num)) {
      throw new Error(`Invalid numeric string: "${value}"`);
    }
  } else {
    num = value;
  }

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

  return `${symbol}${formattedNumber}`;
}

/**
 * Format a Date or ISO string to YYYY-MM-DD
 * Optionally provide locale for formatting differently
 */
export function formatDate(date: Date | string, locale = 'en-CA'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale); // 'en-CA' gives YYYY-MM-DD
}

/**
 * Format a Date or ISO string to readable datetime: e.g., 15 Aug 2025, 11:13 AM
 */
export function formatDateTime(
  date: Date | string,
  locale = 'en-IN',
  options?: Intl.DateTimeFormatOptions
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
}

export function capitalizeFirstLetter(str: string | null): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format sync interval for display (e.g., "15 min", "2h", "1d")
 */
export function formatSyncInterval(interval: number): string {
  if (interval >= 1440) {
    const days = interval / 1440;
    return `${days}d`;
  }
  if (interval >= 60) {
    const hours = interval / 60;
    return `${hours}h`;
  }
  return `${interval} min`;
}

/**
 * Format currency display label with symbol, code, and name
 */
export function formatCurrencyLabel(currency: {
  code: string;
  symbol: string;
  name: string;
}): string {
  return `${currency.symbol} ${currency.code} - ${currency.name}`;
}
