import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface TaskExecutionLog {
  timestamp: string;
  status: string;
  details?: string;
  messageCount?: number;
  error?: string;
  executionTimeMs?: number;
  processingRate?: number;
}

interface TaskExecutionHistoryCardProps {
  executionHistory: TaskExecutionLog[];
  maxDisplay?: number;
}

export const TaskExecutionHistoryCard: React.FC<TaskExecutionHistoryCardProps> = ({
  executionHistory,
  maxDisplay = 5,
}) => {
  const recentHistory = executionHistory.slice(0, maxDisplay);

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'skipped':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Recent Task Executions</CardTitle>
      </CardHeader>
      <CardContent>
        {recentHistory.length > 0 ? (
          <View>
            {recentHistory.map((execution, index) => (
              <View
                key={index}
                className="mb-3 rounded-lg border border-border bg-gray-50 p-3 last:mb-0 dark:bg-gray-800">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="small" className="text-gray-500">
                    {formatTimestamp(execution.timestamp)}
                  </Text>
                  <Badge variant={getStatusBadgeVariant(execution.status)}>
                    <Text>{execution.status}</Text>
                  </Badge>
                </View>

                {execution.details && (
                  <Text variant="small" className="mb-2 text-gray-700 dark:text-gray-300">
                    {execution.details}
                  </Text>
                )}

                <View className="flex-row flex-wrap">
                  {execution.messageCount !== undefined && (
                    <View className="mb-1 mr-4">
                      <Text variant="small" className="text-gray-600 dark:text-gray-400">
                        Messages: {execution.messageCount}
                      </Text>
                    </View>
                  )}

                  {execution.executionTimeMs !== undefined && (
                    <View className="mb-1 mr-4">
                      <Text variant="small" className="text-gray-600 dark:text-gray-400">
                        Duration: {formatExecutionTime(execution.executionTimeMs)}
                      </Text>
                    </View>
                  )}

                  {execution.processingRate !== undefined && execution.processingRate > 0 && (
                    <View className="mb-1 mr-4">
                      <Text variant="small" className="text-gray-600 dark:text-gray-400">
                        Rate: {execution.processingRate.toFixed(1)}/s
                      </Text>
                    </View>
                  )}
                </View>

                {execution.error && (
                  <Text variant="small" className="mt-2 text-red-600">
                    Error: {execution.error}
                  </Text>
                )}
              </View>
            ))}

            {executionHistory.length > maxDisplay && (
              <Text variant="small" className="mt-3 text-center italic text-gray-500">
                Showing {maxDisplay} of {executionHistory.length} executions
              </Text>
            )}
          </View>
        ) : (
          <View className="py-4 text-center">
            <Text className="mb-2 italic text-gray-500">No execution history available</Text>
            <Text variant="small" className="text-gray-400">
              Task execution records will appear here after background tasks run
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
};
