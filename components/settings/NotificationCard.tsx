import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface NotificationCardProps {
  notificationsEnabled: boolean;
  onNotificationsToggle: (value: boolean) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notificationsEnabled,
  onNotificationsToggle,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage notification preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-1">
            <Text className="font-medium">Push Notifications</Text>
            <Text className="text-sm text-muted-foreground">
              Receive alerts for important transactions
            </Text>
          </View>
          <Switch checked={notificationsEnabled} onCheckedChange={onNotificationsToggle} />
        </View>
      </CardContent>
    </Card>
  );
};
