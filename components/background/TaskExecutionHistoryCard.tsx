import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface TaskExecutionHistoryCardProps {
  taskHistory: any[];
}

export const TaskExecutionHistoryCard: React.FC<TaskExecutionHistoryCardProps> = ({
  taskHistory,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Task Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        {taskHistory.length > 0 ? (
          taskHistory.map((execution, index) => (
            <View key={index} className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
              <View className="flex-row justify-between">
                <Text className="font-medium">{execution.status || 'Executed'}</Text>
                <Text className="text-xs text-gray-500">
                  {execution.timestamp
                    ? new Date(execution.timestamp).toLocaleString()
                    : 'Unknown time'}
                </Text>
              </View>
              {execution.details && (
                <Text className="mt-1 text-sm text-gray-600">{execution.details}</Text>
              )}
              {execution.messageCount !== undefined && (
                <Text className="mt-1 text-xs text-gray-500">
                  Messages processed: {execution.messageCount}
                </Text>
              )}
              {execution.error && (
                <Text className="mt-1 text-xs text-red-500">Error: {execution.error}</Text>
              )}
            </View>
          ))
        ) : (
          <Text className="italic text-gray-500">No task execution history found</Text>
        )}
      </CardContent>
    </Card>
  );
};
