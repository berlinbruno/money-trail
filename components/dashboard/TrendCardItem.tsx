import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { capitalizeFirstLetter, formatAmountWithCurrency } from '@/utils/formatters';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Label } from '../ui/label';

type TrendCardItemProps = {
  id: number | string;
  label: string;
  value: number;
  color: string;
  direction: 'up' | 'down' | 'flat';
};

export function TrendCardItem({ id, label, value, color, direction }: TrendCardItemProps) {
  const { selectedCurrency } = useSettings();
  const TrendIcon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Activity;

  return (
    <Card key={id} className="flex flex-row items-center justify-between border-0 border-none p-1">
      {/* Left side */}
      <View className="flex flex-row items-center gap-2">
        <View className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
        <Label>{capitalizeFirstLetter(label)}</Label>
      </View>

      {/* Right side */}
      <View className="flex flex-row items-center gap-2">
        <Label>{formatAmountWithCurrency(value, selectedCurrency)}</Label>
        <TrendIcon
          size={20}
          color={direction === 'up' ? '#FF3B30' : direction === 'down' ? '#007AFF' : '#28A745'}
        />
      </View>
    </Card>
  );
}
