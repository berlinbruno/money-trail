import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast, useToastHelpers } from '@/contexts/ToastProvider';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function ToastDemo() {
  const { showToast, hideAllToasts } = useToast();
  const { showSuccess, showError } = useToastHelpers();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="mb-2 text-2xl font-bold text-foreground">Toast Demo</Text>
        <Text className="mb-6 text-muted-foreground">
          Simple toast notifications that appear in the bottom-right corner
        </Text>

        {/* Toast Variants */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-semibold text-foreground">Toast Variants:</Text>

          <View className="space-y-3">
            <Button
              onPress={() =>
                showSuccess({
                  title: 'Success!',
                  description: 'Your action was completed successfully',
                })
              }
              className="bg-green-600 hover:bg-green-700">
              <Text className="font-medium text-white">Show Success Toast</Text>
            </Button>

            <Button
              onPress={() =>
                showError({
                  title: 'Error!',
                  description: 'Something went wrong, please try again',
                })
              }
              className="bg-red-600 hover:bg-red-700">
              <Text className="font-medium text-white">Show Error Toast</Text>
            </Button>
          </View>
        </View>

        {/* Custom Duration Settings */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-semibold text-foreground">Custom Settings:</Text>

          <View className="space-y-3">
            <Button
              onPress={() =>
                showToast({
                  title: 'Long Duration Toast',
                  description: 'This toast will stay for 8 seconds',
                  duration: 8000,
                })
              }
              variant="outline">
              <Text className="font-medium">8 Second Toast</Text>
            </Button>

            <Button
              onPress={() =>
                showToast({
                  title: 'Persistent Toast',
                  description: 'This toast stays until swiped away',
                  duration: 0, // No auto-dismiss
                })
              }
              variant="outline">
              <Text className="font-medium">Persistent Toast</Text>
            </Button>

            <Button
              onPress={() =>
                showToast({
                  title: 'Swipe to Dismiss!',
                  description: 'Try swiping this toast left or right to dismiss it',
                  duration: 0,
                })
              }
              className="bg-purple-600 hover:bg-purple-700">
              <Text className="font-medium text-white">Test Swipe Gesture</Text>
            </Button>

            <Button
              onPress={() => {
                // Show multiple toasts quickly to demonstrate stacking
                showSuccess({ title: 'Stack Test 1', description: 'First toast' });
                setTimeout(
                  () => showError({ title: 'Stack Test 2', description: 'Second toast' }),
                  200
                );
                setTimeout(
                  () => showToast({ title: 'Stack Test 3', description: 'Third toast' }),
                  400
                );
              }}
              className="bg-orange-600 hover:bg-orange-700">
              <Text className="font-medium text-white">Test Multiple Toasts</Text>
            </Button>
          </View>
        </View>

        {/* Clear All Button */}
        <Button onPress={hideAllToasts} variant="destructive" className="mb-4">
          <Text className="font-medium text-white">Clear All Toasts</Text>
        </Button>

        {/* Instructions */}
        <View className="mt-6 rounded-lg bg-muted p-4">
          <Text className="text-sm text-muted-foreground">
            • Always appears in bottom-right corner{'\n'}• 2 variants: default (success) and
            destructive (error){'\n'}• Configurable duration{'\n'}• Multiple toasts stack vertically
            (max 3){'\n'}• Newest toasts appear at the top{'\n'}• Swipe left/right to dismiss
            {'\n'}• No manual dismiss button
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
