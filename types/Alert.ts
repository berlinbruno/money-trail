import { ALERT_FREQUENCIES, ALERT_TYPES } from '@/constants/alertsConstants';
import { ID, Timestamp } from './Common';
import { TransactionCategory } from './Transaction';

export type AlertType = (typeof ALERT_TYPES)[number];
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

export interface NewAlert {
  threshold: number;
  type: AlertType;
  frequency: AlertFrequency;
  category: TransactionCategory;
  created_at: Timestamp;
}

export interface EditAlert {
  id: ID;
  category: TransactionCategory;
  threshold: number;
  updated_at: Timestamp;
}

export interface Alert {
  id: ID;
  type: AlertType;
  frequency: AlertFrequency;
  category: TransactionCategory;
  threshold: number;
  created_at: Timestamp;
  updated_at?: Timestamp;
  current_value?: number;
}
