import { Text } from '@/components/ui/text';
import { markNotificationAsRead } from '@/lib/database/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const severityColors: Record<INotificationRow['severity'], string> = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#FACC15',
  low: '#3B82F6',
  info: '#22D3EE',
  success: '#16A34A',
};

export interface NotificationCardProps {
  notification: INotificationRow;
  onMarkedRead?: (id: number) => void;
}

export function NotificationCard({ notification, onMarkedRead }: NotificationCardProps) {
  const db = useSQLiteContext();

  const markAsRead = useCallback(async () => {
    try {
      await markNotificationAsRead(db, Number(notification.id));
      onMarkedRead?.(Number(notification.id));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      Alert.alert('Error', 'Unable to mark notification as read. Please try again.');
    }
  }, [db, notification.id, onMarkedRead]);

  if (!notification.title || !notification.message) return null;

  return (
    <Swipeable
      containerStyle={{ flex: 1, width: '100%' }}
      renderRightActions={() => (
        <View
          className="mr-1 w-20 items-center justify-center rounded-r-lg bg-destructive"
          style={{
            minHeight: 48,
          }}>
          <Button
            variant={null}
            size={null}
            className="w-full flex-1 items-center justify-center"
            onPress={markAsRead}>
            <Text className="text-sm font-semibold text-white">Mark Read</Text>
          </Button>
        </View>
      )}
      dragOffsetFromRightEdge={5}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}>
      <View
        className="max-h-30 rounded-xl shadow-md"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: severityColors[notification.severity],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <Card className="py-2">
          <CardHeader className="px-2 py-0">
            <CardContent className="flex-row items-center justify-between p-0">
              <CardTitle className="justify-start" numberOfLines={1}>
                {notification.title}
              </CardTitle>
              {notification.created_at && (
                <Text>
                  {new Date(notification.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </CardContent>
            <CardDescription numberOfLines={2}>{notification.message}</CardDescription>
          </CardHeader>
        </Card>
      </View>
    </Swipeable>
  );
}
