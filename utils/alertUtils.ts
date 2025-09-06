// Utility functions for alert logic
import { IAlertRow } from '@/types/Common';

export function calculateUsageRatio(alerts: IAlertRow[]): number {
  if (alerts.length === 0) return 0;
  const totalThreshold = alerts.reduce((sum, alert) => sum + alert.threshold, 0);
  // Use alert.progress * alert.threshold as a proxy for current_value
  const totalCurrentValue = alerts.reduce(
    (sum, alert) => sum + alert.progress * alert.threshold,
    0
  );
  return totalThreshold > 0 ? Math.min(totalCurrentValue / totalThreshold, 1) : 0;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}
