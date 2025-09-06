import { TransactionType } from '@/types/Transaction';
import { formatAmount, formatDate } from '@/utils/formatters';
import React from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';

export interface TransactionCardProps {
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ title, amount, date, type }) => {
  return (
    <Card className="m-1 h-20 flex-row items-center justify-between">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {date && <CardDescription>{formatDate(date)}</CardDescription>}
      </CardHeader>
      <CardFooter>
        {type === 'credit' ? (
          <Label className="text-[#34C759]">{formatAmount(amount)}</Label>
        ) : (
          <Label className="text-[#FF3B30]">{formatAmount(amount)}</Label>
        )}
      </CardFooter>
    </Card>
  );
};

export default TransactionCard;
