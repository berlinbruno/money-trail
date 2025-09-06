import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { INotificationRow } from '@/types/Common';
import React from 'react';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { DashboardNotificationCard } from './DashboardNotificationCard';

export interface DashboardNotificationsSectionProps {
  notifications: INotificationRow[];
  onMarkedRead: (id: number) => void;
}

export function DashboardNotificationsSection({
  notifications,
  onMarkedRead,
}: DashboardNotificationsSectionProps) {
  if (notifications.length === 0) return null;

  return (
    <Card className="mb-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <Button variant={'link'}>
          <Text>Clear All</Text>
        </Button>
      </CardHeader>
      <CardFooter className="flex-grow flex-col items-start gap-1">
        {notifications.map((notification) => (
          <DashboardNotificationCard
            key={notification.id}
            notification={notification}
            onMarkedRead={onMarkedRead}
          />
        ))}
      </CardFooter>
    </Card>
  );
}
