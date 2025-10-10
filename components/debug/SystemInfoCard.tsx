import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface SystemInfoCardProps {
  appVersion: string;
  memoryUsage: any;
}

export const SystemInfoCard: React.FC<SystemInfoCardProps> = ({ appVersion, memoryUsage }) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      {memoryUsage ? (
        <CardContent>
          <Text className="mb-1">App Version: {appVersion}</Text>
          {memoryUsage.deviceName && <Text className="mb-1">Device: {memoryUsage.deviceName}</Text>}
          {memoryUsage.deviceModel && (
            <Text className="mb-1">Model: {memoryUsage.deviceModel}</Text>
          )}
          {memoryUsage.brand && <Text className="mb-1">Brand: {memoryUsage.brand}</Text>}
          {memoryUsage.deviceType && <Text className="mb-1">Type: {memoryUsage.deviceType}</Text>}
          {memoryUsage.isDevice && (
            <Text className="mb-1">Environment: {memoryUsage.isDevice}</Text>
          )}
          {memoryUsage.osName && <Text className="mb-1">OS: {memoryUsage.osName}</Text>}
          {memoryUsage.osVersion && (
            <Text className="mb-1">OS Version: {memoryUsage.osVersion}</Text>
          )}
          {memoryUsage.androidRelease && (
            <Text className="mb-1">Android Release: {memoryUsage.androidRelease}</Text>
          )}
          {memoryUsage.deviceInfo && (
            <Text className="mb-1">Platform: {memoryUsage.deviceInfo}</Text>
          )}

          {memoryUsage.deviceError && (
            <Text className="mt-2 text-xs italic text-amber-500">
              Note: {memoryUsage.deviceError}
            </Text>
          )}

          {memoryUsage.note && (
            <Text className="mt-2 text-xs italic text-muted-foreground">{memoryUsage.note}</Text>
          )}

          {memoryUsage.error && (
            <Text className="mt-2 text-xs text-destructive">Error: {memoryUsage.error}</Text>
          )}

          {memoryUsage.errorDetails && (
            <Text className="text-xs text-destructive">{memoryUsage.errorDetails}</Text>
          )}
        </CardContent>
      ) : (
        <View className="mt-2 rounded-md bg-muted p-3">
          <Text className="text-muted-foreground">Loading system information...</Text>
        </View>
      )}
    </Card>
  );
};
