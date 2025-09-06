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
