// Utility functions for DB queries
import { AlertFrequency } from '@/types/Alert';
import { Period } from '@/types/Insight';

/**
 * Returns the SQLite strftime format string for a given alert frequency.
 * @param frequency 'weekly' | 'monthly'
 */
export function getDateFormat(frequency: AlertFrequency): string {
  switch (frequency) {
    case 'weekly':
      return '%Y-%W';
    case 'monthly':
      return '%Y-%m';
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

export function getDateCondition(period: Period): string {
  switch (period) {
    case 'Weekly':
      return `strftime('%Y-%W', date) = strftime('%Y-%W', 'now')`;
    case 'Monthly':
      return `strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`;
    case 'Yearly':
      return `strftime('%Y', date) = strftime('%Y', 'now')`;
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}
