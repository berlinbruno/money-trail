import { AlertFrequency, AlertType } from '@/types/Alert';

export const ALERT_TYPES = ['income', 'spending'] as const;
export const ALERT_FREQUENCIES = ['weekly', 'monthly'] as const;

export const ALERT_LABELS: Record<string, string> = {
  'income-weekly': 'Income - Weekly',
  'income-monthly': 'Income - Monthly',
  'spending-weekly': 'Spending - Weekly',
  'spending-monthly': 'Spending - Monthly',
};

export const ALERT_TYPE_FREQUENCY_MAP: Record<
  string,
  { type: AlertType; frequency: AlertFrequency }
> = {
  'income-weekly': { type: 'income', frequency: 'weekly' },
  'income-monthly': { type: 'income', frequency: 'monthly' },
  'spending-weekly': { type: 'spending', frequency: 'weekly' },
  'spending-monthly': { type: 'spending', frequency: 'monthly' },
};
