// components/card/AlertProgressCard.tsx
import { Card, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { CATEGORY_COLORS } from '@/constants/transactionConstants';
import { TransactionCategory } from '@/types/Transaction';
import { capitalizeFirstLetter, formatAmount } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';
import LegendItem from '../insights/LegendItem';
import { Progress } from '../ui/progress';

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
    <Card className="m-1 h-20 gap-1">
      <CardHeader className="flex-row items-start justify-between px-2">
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
      <CardFooter className="px-2">
        <Progress value={progress} indicatorClassName={progressColor} />
      </CardFooter>
    </Card>
  );
}
