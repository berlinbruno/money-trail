import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { MESSAGE_SCAN_COUNTS, SYNC_INTERVALS } from '@/constants/settingsConstants';
import { formatSyncInterval } from '@/utils/formatterUtils';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

interface SyncSettingsCardProps {
  backgroundSyncEnabled: boolean;
  syncInterval: number;
  messageScanCount: number;
  lastSyncTime: Date | null;
  onBackgroundSyncToggle: (value: boolean) => void;
  onSyncIntervalChange: (interval: number) => void;
  onMessageScanCountChange: (count: number) => void;
  onResetSyncTime: () => void;
}

export const SyncSettingsCard: React.FC<SyncSettingsCardProps> = ({
  backgroundSyncEnabled,
  syncInterval,
  messageScanCount,
  lastSyncTime,
  onBackgroundSyncToggle,
  onSyncIntervalChange,
  onMessageScanCountChange,
  onResetSyncTime,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Sync & Background Tasks</CardTitle>
        <CardDescription>Configure automatic SMS processing</CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center justify-between border-b border-border py-3">
          <View className="flex-1">
            <Text className="font-medium">Background Sync</Text>
            <Text className="text-sm text-muted-foreground">
              Automatically process SMS messages
            </Text>
          </View>
          <Switch checked={backgroundSyncEnabled} onCheckedChange={onBackgroundSyncToggle} />
        </View>

        <View className="py-3">
          <Text className="mb-2 font-medium">Sync Interval</Text>
          <Text className="mb-3 text-sm text-muted-foreground">
            How often to check for new SMS messages
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerStyle={{ gap: 8 }}>
            {SYNC_INTERVALS.map((interval) => (
              <TouchableOpacity
                key={interval}
                className={`rounded-full px-3 py-2 ${
                  syncInterval === interval ? 'bg-primary' : 'bg-secondary'
                }`}
                onPress={() => onSyncIntervalChange(interval)}>
                <Text
                  className={
                    syncInterval === interval
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }>
                  {formatSyncInterval(interval)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="border-t border-border py-3">
          <Text className="mb-2 font-medium">Messages to Scan</Text>
          <Text className="mb-3 text-sm text-muted-foreground">
            Maximum number of SMS messages to process per sync
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerStyle={{ gap: 8 }}>
            {MESSAGE_SCAN_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                className={`rounded-full px-3 py-2 ${
                  messageScanCount === count ? 'bg-primary' : 'bg-secondary'
                }`}
                onPress={() => onMessageScanCountChange(count)}>
                <Text
                  className={
                    messageScanCount === count
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }>
                  {count} msgs
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="border-t border-border pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-medium">Last Sync</Text>
              <Text className="text-sm text-muted-foreground">
                {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never synced'}
              </Text>
            </View>
            <Button variant="outline" size="sm" onPress={onResetSyncTime}>
              <Text>Reset</Text>
            </Button>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};
