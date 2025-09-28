import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface AppBehaviorCardProps {
  fetchOnLaunch: boolean;
  autoApproval: boolean;
  onFetchOnLaunchToggle: (value: boolean) => void;
  onAutoApprovalToggle: (value: boolean) => void;
}

export function AppBehaviorCard({
  fetchOnLaunch,
  autoApproval,
  onFetchOnLaunchToggle,
  onAutoApprovalToggle,
}: AppBehaviorCardProps) {
  return (
    <Card className="mx-4 mb-4 p-4">
      <Text className="mb-4 text-lg font-semibold">App Behavior</Text>

      {/* Fetch Messages on Launch */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium">Fetch Messages on Launch</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Automatically scan for new SMS messages when the app starts
          </Text>
        </View>
        <Switch checked={fetchOnLaunch} onCheckedChange={onFetchOnLaunchToggle} />
      </View>

      {/* Auto Approval */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium">Auto Approval</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Automatically approve all transactions without manual review
          </Text>
        </View>
        <Switch checked={autoApproval} onCheckedChange={onAutoApprovalToggle} />
      </View>

      {autoApproval && (
        <View className="mt-3 rounded-md bg-amber-50 p-3">
          <Text className="text-xs text-amber-800">
            ⚠️ Warning: Auto approval will immediately add all detected transactions without your
            review. Make sure your SMS parsing is accurate before enabling this feature.
          </Text>
        </View>
      )}
    </Card>
  );
}
