import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

export default function InsightItem({ text, color }: { text: string; color?: string }) {
  return (
    <View className="mb-1 flex-row items-center">
      <View style={{ backgroundColor: color }} className="mr-2 h-3 w-3 rounded-full" />
      <Text>{text}</Text>
    </View>
  );
}
