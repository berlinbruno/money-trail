// components/card/AlertProgressCard.tsx
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { CATEGORY_COLORS } from '@/constants/transactionConstants';
import { TransactionCategory } from '@/types/Transaction';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';
import LegendItem from '../insights/LegendItem';

interface AlertProgressCardProps {
  currentValue: number;
  threshold: number;
  category: string;
  progressColor?: string;
}

export default function AlertProgressCard({
  currentValue,
  threshold,
  category,
  progressColor,
}: AlertProgressCardProps) {
  const progress = Math.min(currentValue / threshold, 1) * 100;

  return (
    <Card className="h-24">
      <CardHeader className="flex-row items-start justify-between">
        <View className="flex-1 flex-row justify-between">
          <LegendItem
            color={CATEGORY_COLORS[category as TransactionCategory]}
            label={capitalizeFirstLetter(category)}
          />
          <CardDescription>
            {formatAmount(currentValue)} / {formatAmount(threshold)}
          </CardDescription>
        </View>
      </CardHeader>

      <View className="px-3">
        <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4 }}>
          <View
            style={{
              width: `${Math.min(progress, 100)}%`, // ✅ clamp at 100
              height: 8,
              backgroundColor: progressColor,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </Card>
  );
}
