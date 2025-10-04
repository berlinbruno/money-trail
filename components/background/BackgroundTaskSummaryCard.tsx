import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { BACKGROUND_TASK_OPTIONS } from '@/lib/sms/backgroundTask';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { View } from 'react-native';

interface BackgroundTaskSummaryCardProps {
  registeredTasks: TaskManager.TaskManagerTask[];
  lastExecutionTime: string | null;
  taskConfig: {
    enabled?: boolean;
    intervalMinutes?: number;
    messageScanCount?: number;
    runOnAppLaunch?: boolean;
  };
  taskHistoryLength?: number;
}

export const BackgroundTaskSummaryCard: React.FC<BackgroundTaskSummaryCardProps> = ({
  registeredTasks,
  lastExecutionTime,
  taskConfig,
  taskHistoryLength,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Background Task Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-between border-b border-border py-2">
          <Text className="font-medium">Background Sync:</Text>
          <Text className={taskConfig.enabled ? 'text-green-600' : 'text-red-600'}>
            {taskConfig.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        {registeredTasks.length > 0 ? (
          <>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Task Status:</Text>
              <Text className={lastExecutionTime ? 'text-green-600' : 'text-amber-600'}>
                {lastExecutionTime ? 'Active' : 'No Recent Executions'}
              </Text>
            </View>
            {lastExecutionTime && (
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Last Execution:</Text>
                <Text className="text-sm">{lastExecutionTime}</Text>
              </View>
            )}
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Registered Tasks:</Text>
              <Text className="text-primary">{registeredTasks.length}</Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Sync Interval:</Text>
              <Text>
                Every {taskConfig.intervalMinutes || BACKGROUND_TASK_OPTIONS.minimumInterval} min
              </Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Message Scan Count:</Text>
              <Text>{taskConfig.messageScanCount || 200} messages</Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Run on App Launch:</Text>
              <Text className={taskConfig.runOnAppLaunch ? 'text-green-600' : 'text-gray-500'}>
                {taskConfig.runOnAppLaunch ? 'Yes' : 'No'}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="font-medium">Execution History:</Text>
              <Text className="text-primary">{taskHistoryLength || 0} records</Text>
            </View>
          </>
        ) : (
          <View>
            <Text className="mb-2 italic text-gray-500">No background tasks registered</Text>
            {!taskConfig.enabled && (
              <Text variant="small" className="text-amber-600">
                Background sync is disabled in settings. Enable it to start automatic SMS
                processing.
              </Text>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
};
