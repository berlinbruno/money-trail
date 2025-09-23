import { getCurrencyFormat } from '@/lib/db/settingsQueries';

/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
};

/**
 * Get currency symbol for the given currency code
 * @param currencyCode The currency code (e.g., 'USD', 'EUR')
 * @returns The currency symbol
 */
export function getCurrencySymbolByCode(currencyCode: string): string {
  return CURRENCY_SYMBOL_MAP[currencyCode] || '$';
}

/**
 * Get currency symbol based on stored currency format setting
 * @returns Promise<string> The currency symbol
 */
export async function getCurrencySymbol(): Promise<string> {
  const currencyCode = await getCurrencyFormat();
  return getCurrencySymbolByCode(currencyCode);
}
