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
            <View key={index} className="mb-2 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <Text variant="large">{task.taskName}</Text>
              <Text variant="small" className="text-gray-500">
                Type: {task.taskType}
              </Text>
              {task.options && (
                <>
                  <Text variant="small" className="text-gray-500">
                    Interval: {task.options.minimumInterval} minutes
                  </Text>
                  {task.options.requiredNetworkType && (
                    <Text variant="small" className="text-gray-500">
                      Network: {task.options.requiredNetworkType}
                    </Text>
                  )}
                  {task.options.stopOnTerminate !== undefined && (
                    <Text variant="small" className="text-gray-500">
                      Stop on Terminate: {task.options.stopOnTerminate ? 'Yes' : 'No'}
                    </Text>
                  )}
                  {task.options.startOnBoot !== undefined && (
                    <Text variant="small" className="text-gray-500">
                      Start on Boot: {task.options.startOnBoot ? 'Yes' : 'No'}
                    </Text>
                  )}
                </>
              )}
            </View>
          ))
        ) : (
          <Text className="italic text-gray-500">No registered tasks found</Text>
        )}
      </CardContent>
    </Card>
  );
};
