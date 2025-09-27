import { TRANSACTION_CATEGORIES } from '@/constants/transactionConstants';
import { useSettings } from '@/contexts/SettingsContext';
import { Alert } from '@/types/Alert';
import { IAlertRow } from '@/types/Common';
import { TransactionCategory } from '@/types/Transaction';
import { formatAmountWithCurrency } from '@/utils/formatterUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Text } from '../ui/text';
import AlertProgressCard from './AlertProgressCard';

interface Props {
  categoryKey: string;
  alerts: Alert[];
  expanded: boolean;
  onToggleExpand: (category: string) => void;
  onAddAlert: (category: string, availableCategories: TransactionCategory[]) => void;
  onEditAlert: (alert: Alert, availableCategories: TransactionCategory[]) => void;
  onDeleteAlert: (id: string) => void;
  label: string;
}

export default function AlertCategoryCard({
  categoryKey,
  alerts,
  expanded,
  onToggleExpand,
  onAddAlert,
  onEditAlert,
  onDeleteAlert,
  label,
}: Props) {
  const { selectedCurrency } = useSettings();
  const totalCurrentValue = alerts.reduce((sum, alert) => sum + (alert.current_value ?? 0), 0);
  const totalThreshold = alerts.reduce((sum, alert) => sum + alert.threshold, 0);
  const progressRatio = totalThreshold ? (totalCurrentValue / totalThreshold) * 100 : 0;

  const isSpendingCategory = categoryKey.startsWith('spending');
  const usedCategories = new Set(alerts.map((alert) => alert.category));

  const getAvailableCategories = (): TransactionCategory[] => {
    let baseCategories: TransactionCategory[] = [];

    if (categoryKey.startsWith('income')) {
      baseCategories = [...TRANSACTION_CATEGORIES.credit];
    } else if (categoryKey.startsWith('spending')) {
      baseCategories = [...TRANSACTION_CATEGORIES.debit];
    } else {
      baseCategories = [...TRANSACTION_CATEGORIES.credit, ...TRANSACTION_CATEGORIES.debit];
    }

    return baseCategories.filter((cat) => !usedCategories.has(cat));
  };

  const canAddMore = getAvailableCategories().length > 0;

  return (
    <Card className="mb-2 gap-2 p-0">
      <CardHeader className="flex-row items-start justify-between p-2">
        <TouchableOpacity
          onPress={() => onToggleExpand(categoryKey)}
          className="flex-1 pr-2"
          activeOpacity={0.7}>
          <CardTitle>{label}</CardTitle>
          <CardDescription>
            {formatAmountWithCurrency(totalCurrentValue, selectedCurrency)} /{' '}
            {formatAmountWithCurrency(totalThreshold, selectedCurrency)}
          </CardDescription>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => canAddMore && onAddAlert(categoryKey, getAvailableCategories())}
          disabled={!canAddMore}
          className="mt-1"
          activeOpacity={canAddMore ? 0.7 : 1}>
          <Ionicons name="add-circle-outline" size={28} color={canAddMore ? '#007AFF' : '#ccc'} />
        </TouchableOpacity>
      </CardHeader>
      <CardContent className="p-2 py-0">
        <Progress
          value={progressRatio}
          indicatorClassName={isSpendingCategory ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}
        />
      </CardContent>
      <CardFooter className="p-2">
        {expanded && (
          <SwipeListView
            data={alerts}
            keyExtractor={(alert: IAlertRow, index) => alert.id ?? `alert-${index}`}
            contentContainerStyle={{ paddingBottom: 4 }}
            renderItem={({ item }: { item: IAlertRow }) => (
              <AlertProgressCard
                currentValue={'current_value' in item ? (item as any).current_value : 0}
                threshold={item.threshold}
                category={item.category}
                progressColor={isSpendingCategory ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}
              />
            )}
            renderHiddenItem={({ item }: { item: IAlertRow }) => (
              <View className="m-1 h-20 flex-row items-start justify-end">
                <Button
                  variant={'default'}
                  size={null}
                  className="h-full w-20 rounded-none"
                  onPress={() => onEditAlert(item as any, getAvailableCategories())}>
                  <Text>Edit</Text>
                </Button>
                <Button
                  size={null}
                  variant="destructive"
                  className="h-full w-20 rounded-none rounded-r-xl"
                  onPress={() => onDeleteAlert(item.id)}>
                  <Text>Delete</Text>
                </Button>
              </View>
            )}
            rightOpenValue={-160}
            stopRightSwipe={-160}
            disableRightSwipe
          />
        )}
      </CardFooter>
    </Card>
  );
}
