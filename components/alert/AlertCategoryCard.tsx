import { TRANSACTION_CATEGORIES } from '@/constants/transactionConstants';
import { Alert } from '@/types/Alert';
import { IAlertRow } from '@/types/Common';
import { TransactionCategory } from '@/types/Transaction';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Button } from '../ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
    <Card className="mb-4 px-4 pt-4">
      <View className="mb-3 flex-row items-start">
        <TouchableOpacity
          onPress={() => onToggleExpand(categoryKey)}
          className="flex-1 pr-2"
          activeOpacity={0.7}>
          <CardHeader className="p-0">
            <CardTitle>{label}</CardTitle>
            <CardDescription>
              ₹{totalCurrentValue} / ₹{totalThreshold}
            </CardDescription>
            <View className="pb-3">
              <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4 }}>
                <View
                  style={{
                    width: `${Math.min(progressRatio, 100)}%`, // ✅ clamp at 100
                    height: 8,
                    backgroundColor: isSpendingCategory ? '#FF3B30' : '#007AFF',
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </CardHeader>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => canAddMore && onAddAlert(categoryKey, getAvailableCategories())}
          disabled={!canAddMore}
          className="mt-1"
          activeOpacity={canAddMore ? 0.7 : 1}>
          <Ionicons name="add-circle-outline" size={28} color={canAddMore ? '#007AFF' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <SwipeListView
          data={alerts}
          keyExtractor={(alert: IAlertRow, index) => alert.id ?? `alert-${index}`}
          contentContainerStyle={{ paddingBottom: 4 }}
          renderItem={({ item }: { item: IAlertRow }) => (
            <View key={item.id} className="flex-1 bg-background">
              <AlertProgressCard
                currentValue={'current_value' in item ? (item as any).current_value : 0}
                threshold={item.threshold}
                category={item.category}
                progressColor={isSpendingCategory ? '#FF3B30' : '#007AFF'}
              />
            </View>
          )}
          renderHiddenItem={({ item }: { item: IAlertRow }) => (
            <View style={{ flex: 1 }} className="mb-2 h-full flex-row items-start justify-end">
              <Button
                size={null}
                className="h-full w-20 rounded-none"
                onPress={() => onEditAlert(item as any, getAvailableCategories())}>
                <Text>Edit</Text>
              </Button>
              <Button
                size={null}
                variant="destructive"
                className="h-full w-20 rounded-none rounded-r-lg"
                onPress={() => onDeleteAlert(item.id)}>
                <Text>Delete</Text>
              </Button>
            </View>
          )}
          rightOpenValue={-135}
          disableRightSwipe
        />
      )}
    </Card>
  );
}
