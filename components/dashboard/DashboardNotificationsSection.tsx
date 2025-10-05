import { INotificationRow } from '@/types/Common';
import React from 'react';
import { NotificationSection } from './NotificationSection';

export interface NotificationListSectionProps {
  notifications: INotificationRow[];
  onMarkedRead: (id: number) => void;
  onClearAll?: () => void;
}

export function NotificationListSection({
  notifications,
  onMarkedRead,
  onClearAll,
}: NotificationListSectionProps) {
  return (
    <NotificationSection
      notifications={notifications}
      onMarkedRead={onMarkedRead}
      onClearAll={onClearAll}
      title="Notifications"
    />
  );
}
