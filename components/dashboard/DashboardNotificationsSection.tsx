import { INotificationRow } from '@/types/Common';
import React from 'react';
import { NotificationSection } from './NotificationSection';

export interface DashboardNotificationsSectionProps {
  notifications: INotificationRow[];
  onMarkedRead: (id: number) => void;
  onClearAll?: () => void;
}

export function DashboardNotificationsSection({
  notifications,
  onMarkedRead,
  onClearAll,
}: DashboardNotificationsSectionProps) {
  return (
    <NotificationSection
      notifications={notifications}
      onMarkedRead={onMarkedRead}
      onClearAll={onClearAll}
      title="Notifications"
      variant="compact"
    />
  );
}
