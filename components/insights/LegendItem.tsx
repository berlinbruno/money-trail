import { Text } from '@/components/ui/text';
import { capitalizeFirstLetter } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';
import { Label } from '../ui/label';

export default function LegendItem({
  color,
  label,
  percent,
}: {
  color: string;
  label: string;
  percent?: string;
}) {
  return (
    <View className="mb-2 mr-4 flex-row items-center">
      <View style={{ backgroundColor: color }} className="mr-2 h-3 w-3 rounded-full" />
      <Label>{capitalizeFirstLetter(label)}</Label>
      {percent && (
        <Text className="ml-1" variant={'small'}>
          {percent}%
        </Text>
      )}
    </View>
  );
}
