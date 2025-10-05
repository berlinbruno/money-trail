import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <Card className="m-2">
      <CardHeader>
        <CardTitle>App Behavior</CardTitle>
      </CardHeader>

      {/* Fetch Messages on Launch */}
      <CardContent>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium">Fetch Messages on Launch</Text>
            <CardDescription>
              Automatically scan for new SMS messages when the app starts
            </CardDescription>
          </View>
          <Switch checked={fetchOnLaunch} onCheckedChange={onFetchOnLaunchToggle} />
        </View>

        {/* Auto Approval */}
        <View className="my-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium">Auto Approval</Text>
            <CardDescription>
              Automatically approve all transactions without manual review
            </CardDescription>
          </View>
          <Switch checked={autoApproval} onCheckedChange={onAutoApprovalToggle} />
        </View>
      </CardContent>
      {autoApproval && (
        <CardFooter>
          <CardDescription className="text-xs text-destructive">
            ⚠️ Warning: Auto approval will immediately add all detected transactions without your
            review. Make sure your SMS parsing is accurate before enabling this feature.
          </CardDescription>
        </CardFooter>
      )}
    </Card>
  );
}
