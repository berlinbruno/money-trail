import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { BACKGROUND_TASK_OPTIONS } from '@/lib/sms/backgroundTask';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { View } from 'react-native';

interface BackgroundTaskSummaryCardProps {
  registeredTasks: TaskManager.TaskManagerTask[];
  lastExecutionTime: string | null;
  taskConfig: { intervalMinutes?: number };
  taskHistoryLength: number;
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
        {registeredTasks.length > 0 ? (
          <>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Status:</Text>
              <Text className={lastExecutionTime ? 'text-green-600' : 'text-amber-600'}>
                {lastExecutionTime ? 'Active' : 'No Recent Executions'}
              </Text>
            </View>
            {lastExecutionTime && (
              <View className="flex-row justify-between border-b border-border py-2">
                <Text className="font-medium">Last Execution:</Text>
                <Text>{lastExecutionTime}</Text>
              </View>
            )}
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Registered Tasks:</Text>
              <Text className="text-primary">{registeredTasks.length}</Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Task Settings:</Text>
              <Text>
                Every {taskConfig.intervalMinutes || BACKGROUND_TASK_OPTIONS.minimumInterval} min
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="font-medium">Task History Records:</Text>
              <Text className="text-primary">{taskHistoryLength}</Text>
            </View>
          </>
        ) : (
          <Text className="italic text-gray-500">No background tasks registered</Text>
        )}
      </CardContent>
    </Card>
  );
};
