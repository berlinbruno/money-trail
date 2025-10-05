import { CATEGORY_COLORS } from '@/constants/transactionConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { TransactionCategory, TransactionType } from '@/types/Transaction';
import {
  capitalizeFirstLetter,
  formatAmountWithCurrency,
  formatDate,
} from '@/utils/formatterUtils';
import React from 'react';
import { View } from 'react-native';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Text } from '../ui/text';

export interface TransactionCardProps {
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  category?: TransactionCategory;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  title,
  amount,
  date,
  type,
  category,
}) => {
  const { selectedCurrency } = useSettings();

  return (
    <Card className="m-1 h-20 flex-row items-center justify-between">
      <CardHeader className="flex-1">
        <CardTitle numberOfLines={1}>{title}</CardTitle>
        {date && <CardDescription>{formatDate(date)}</CardDescription>}
      </CardHeader>
      <CardFooter className="flex-col items-end gap-2">
        {category && (
          <View
            className="rounded-full px-2 py-1"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}>
            <Text className="text-xs font-medium text-white">
              {capitalizeFirstLetter(category)}
            </Text>
          </View>
        )}
        <Label className={type === 'credit' ? 'text-success' : 'text-destructive'}>
          {formatAmountWithCurrency(amount, selectedCurrency)}
        </Label>
      </CardFooter>
    </Card>
  );
};

export default TransactionCard;
