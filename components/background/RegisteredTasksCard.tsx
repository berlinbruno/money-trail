import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { View } from 'react-native';

interface RegisteredTasksCardProps {
  registeredTasks: TaskManager.TaskManagerTask[];
}

export const RegisteredTasksCard: React.FC<RegisteredTasksCardProps> = ({ registeredTasks }) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Registered Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {registeredTasks.length > 0 ? (
          registeredTasks.map((task, index) => (
            <View key={index} className="mb-4 rounded-lg bg-gray-50 p-4 last:mb-0 dark:bg-gray-800">
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="large" className="font-semibold">
                  {task.taskName}
                </Text>
                <Badge variant="secondary">
                  <Text>{task.taskType || 'background'}</Text>
                </Badge>
              </View>

              <View>
                <View className="mb-1">
                  <Text variant="small" className="text-gray-600 dark:text-gray-400">
                    Type: {task.taskType || 'Background Task'}
                  </Text>
                </View>

                {task.options && (
                  <>
                    {task.options.minimumInterval && (
                      <View className="mb-1">
                        <Text variant="small" className="text-gray-600 dark:text-gray-400">
                          Interval: Every {task.options.minimumInterval} minutes
                        </Text>
                      </View>
                    )}

                    {task.options.requiredNetworkType && (
                      <View className="mb-1">
                        <Text variant="small" className="text-gray-600 dark:text-gray-400">
                          Network Requirement: {task.options.requiredNetworkType}
                        </Text>
                      </View>
                    )}

                    <View className="mb-1 flex-row">
                      {task.options.stopOnTerminate !== undefined && (
                        <View className="mr-4">
                          <Text variant="small" className="text-gray-600 dark:text-gray-400">
                            Stop on Terminate: {task.options.stopOnTerminate ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      )}

                      {task.options.startOnBoot !== undefined && (
                        <View>
                          <Text variant="small" className="text-gray-600 dark:text-gray-400">
                            Start on Boot: {task.options.startOnBoot ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {!task.options && (
                  <Text variant="small" className="italic text-gray-500">
                    No configuration options available
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View className="py-4 text-center">
            <Text className="mb-2 italic text-gray-500">No registered tasks found</Text>
            <Text variant="small" className="text-gray-400">
              Background tasks will appear here when registered and active
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
};
