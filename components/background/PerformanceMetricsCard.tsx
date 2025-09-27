import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface PerformanceMetricsCardProps {
  performanceMetrics: {
    avgExecutionTime: number;
    successRate: number;
    totalRuns: number;
    totalMessages: number;
  };
  taskHistoryLength: number;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  performanceMetrics,
  taskHistoryLength,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {taskHistoryLength > 0 ? (
          <>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Success Rate:</Text>
              <Text
                className={
                  performanceMetrics.successRate > 80 ? 'text-green-600' : 'text-amber-600'
                }>
                {performanceMetrics.successRate.toFixed(1)}%
              </Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Avg. Execution Time:</Text>
              <Text>{(performanceMetrics.avgExecutionTime / 1000).toFixed(2)} sec</Text>
            </View>
            <View className="flex-row justify-between border-b border-border py-2">
              <Text className="font-medium">Total Executions:</Text>
              <Text>{performanceMetrics.totalRuns}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="font-medium">Total Messages Processed:</Text>
              <Text>{performanceMetrics.totalMessages}</Text>
            </View>
          </>
        ) : (
          <Text className="italic text-gray-500">No performance data available</Text>
        )}
      </CardContent>
    </Card>
  );
};
