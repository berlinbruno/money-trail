// components/card/AlertProgressCard.tsx
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { capitalizeFirstLetter } from '@/utils/formatters';
import React from 'react';
import { View } from 'react-native';

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
    <Card className="mb-2">
      <CardHeader className="flex-row items-start justify-between p-3">
        <View className="flex-1 pr-2">
          <CardTitle className="mb-1">{capitalizeFirstLetter(category)}</CardTitle>
          <CardDescription>
            ₹{currentValue ?? 0} / ₹{threshold}
          </CardDescription>
        </View>
      </CardHeader>

      <View className="px-3 pb-3">
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
