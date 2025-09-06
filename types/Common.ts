// Common/shared types for MoneyTrail

export type ID = string;
export type Timestamp = string;

export type Direction = 'up' | 'down' | 'flat';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success';

export interface BaseEntity {
  id: ID;
  created_at: Timestamp;
  updated_at?: Timestamp;
}

export type IAlertRow = {
  id: ID;
  type: string;
  category: string;
  threshold: number;
  progress: number;
};

export type INotificationRow = {
  id: ID;
  type: 'transaction' | 'alert' | 'system';
  title: string;
  message: string;
  severity: Severity;
  is_read: 0 | 1;
  created_at: Timestamp;
  updated_at: Timestamp | null;
};
