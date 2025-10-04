import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDialog } from '@/contexts/DialogProvider';
import { clearAllNotifications } from '@/lib/database/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { NotificationCard } from './NotificationCard';

export interface NotificationSectionProps {
  notifications: INotificationRow[];
  onMarkedRead: (id: number) => void;
  onClearAll?: () => void;
  title?: string;
  maxVisible?: number;
}

export function NotificationSection({
  notifications,
  onMarkedRead,
  onClearAll,
  title = 'Notifications',
  maxVisible = 3,
}: NotificationSectionProps) {
  const db = useSQLiteContext();
  const { showConfirmationDialog } = useDialog();

  // Limit notifications to maxVisible count (most recent first)
  const visibleNotifications = notifications.slice(0, maxVisible);

  const handleClearAll = useCallback(() => {
    showConfirmationDialog({
      title: 'Clear All Notifications',
      description:
        'Are you sure you want to mark all notifications as read? This action cannot be undone.',
      confirmText: 'Clear All',
      loadingText: 'Clearing...',
      onConfirm: async () => {
        try {
          await clearAllNotifications(db);
          onClearAll?.();
        } catch (err) {
          console.error('Failed to clear notifications:', err);
          // Could add toast error here if ToastProvider is available
          throw err; // Let the dialog handle the error state
        }
      },
    });
  }, [db, onClearAll, showConfirmationDialog]);

  if (visibleNotifications.length === 0) return null;

  return (
    <Card className="mb-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          {title}
          {notifications.length > maxVisible && (
            <Text className="text-xs text-muted-foreground">
              (+{notifications.length - maxVisible} more)
            </Text>
          )}
        </CardTitle>
        <Button variant={'link'} onPress={handleClearAll}>
          <Text>Clear All</Text>
        </Button>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-0.5 pt-0">
        {visibleNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkedRead={onMarkedRead}
          />
        ))}
      </CardFooter>
    </Card>
  );
}
