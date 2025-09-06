import { Label } from '@/components/ui/label';
import { CategoryBreakdown } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';

export default function PieCenterLabel({
  focused,
  fallbackLabel,
}: {
  focused: CategoryBreakdown | null;
  fallbackLabel: string;
}) {
  return (
    <View className="flex items-center justify-center">
      {focused && focused.value > 0 ? (
        <>
          <Label>{formatAmount(focused.value)}</Label>
          <Label>{capitalizeFirstLetter(focused.category)}</Label>
        </>
      ) : (
        <Label>{fallbackLabel}</Label>
      )}
    </View>
  );
}
