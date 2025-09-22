import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import { CategoryBreakdown } from '@/types/Insight';
import { capitalizeFirstLetter, formatAmountWithCurrency } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';

export default function PieCenterLabel({
  focused,
  fallbackLabel,
}: {
  focused: CategoryBreakdown | null;
  fallbackLabel: string;
}) {
  const { selectedCurrency } = useSettings();

  return (
    <View className="flex items-center justify-center">
      {focused && focused.value > 0 ? (
        <>
          <Label>{formatAmountWithCurrency(focused.value, selectedCurrency)}</Label>
          <Label>{capitalizeFirstLetter(focused.category)}</Label>
        </>
      ) : (
        <Label>{fallbackLabel}</Label>
      )}
    </View>
  );
}
