import { Text } from '@/components/ui/text';
import { markNotificationAsUnread } from '@/lib/db/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Button } from '../ui/button';
import { Card, CardDescription, CardFooter, CardHeader } from '../ui/card';
import { Label } from '../ui/label';

const severityColors: Record<INotificationRow['severity'], string> = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#FACC15',
  low: '#3B82F6',
  info: '#22D3EE',
  success: '#16A34A',
};

export type NotificationCardItemProps = {
  notification: INotificationRow;
  onMarkedRead?: (id: number) => void;
};

export function NotificationCardItem({ notification, onMarkedRead }: NotificationCardItemProps) {
  const db = useSQLiteContext();
  const markAsUnread = useCallback(async () => {
    try {
      await markNotificationAsUnread(db, Number(notification.id));
      onMarkedRead?.(Number(notification.id));
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
      Alert.alert('Error', 'Unable to mark notification as unread.');
    }
  }, [db, notification.id, onMarkedRead]);

  if (!notification.title || !notification.message) return null;

  return (
    <Swipeable
      containerStyle={{ flex: 1, width: '100%' }}
      renderRightActions={() => (
        <Button
          variant={'destructive'}
          size={null}
          className="mr-1 h-full w-28 rounded-none rounded-r-lg px-1"
          onPress={markAsUnread}>
          <Text className="font-semibold">Mark Unread</Text>
        </Button>
      )}
      rightThreshold={40}
      overshootRight={false}>
      <View
        style={{
          borderLeftWidth: 6,
          borderLeftColor: severityColors[notification.severity],
          borderRadius: 8,
        }}>
        <Card className="h-20 rounded-lg border border-border">
          <CardHeader className="mb-0 p-1">
            <Label>{notification.title}</Label>
          </CardHeader>
          <CardFooter className="p-1">
            <CardDescription>{notification.message}</CardDescription>
          </CardFooter>
        </Card>
      </View>
    </Swipeable>
  );
}
