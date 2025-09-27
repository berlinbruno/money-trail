import { Text } from '@/components/ui/text';
import { markNotificationAsRead } from '@/lib/database/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

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
  variant?: 'compact' | 'full';
}

export function NotificationCard({
  notification,
  onMarkedRead,
  variant = 'full',
}: NotificationCardProps) {
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
          className="mr-1 flex-1 items-center justify-center rounded-r-lg"
          style={{
            backgroundColor: '#EF4444',
            minHeight: variant === 'compact' ? 50 : 60,
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
      rightThreshold={40}
      overshootRight={false}>
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: severityColors[notification.severity],
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <Card className="rounded-lg border-0 bg-card/95 backdrop-blur-sm">
          <View className={`p-3 ${variant === 'compact' ? 'py-1' : 'py-3'}`}>
            <View className="mb-1 flex-row items-start justify-between">
              <Text
                className={`font-semibold text-foreground ${
                  variant === 'compact' ? 'text-sm' : 'text-base'
                } mr-2 flex-1`}
                numberOfLines={1}>
                {notification.title}
              </Text>
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: severityColors[notification.severity] }}
              />
            </View>

            <Text
              className={`leading-relaxed text-muted-foreground ${
                variant === 'compact' ? 'text-xs' : 'text-sm'
              }`}
              numberOfLines={variant === 'compact' ? 2 : 3}>
              {notification.message}
            </Text>

            {notification.created_at && variant === 'full' && (
              <Text className="mt-2 text-xs font-medium text-muted-foreground/70">
                {new Date(notification.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        </Card>
      </View>
    </Swipeable>
  );
}
