import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Text } from '../ui/text';

type SortOrder = 'asc' | 'desc';
type SortBy = 'date' | 'amount';

export interface SortFormProps {
  onClose?: () => void;
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  sortBy: SortBy;
  setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;
}

export default function SortForm({
  onClose,
  sortOrder,
  setSortOrder,
  sortBy,
  setSortBy,
}: SortFormProps) {
  return (
    <View>
      <Label>Sort By</Label>
      <View className="flex-row justify-between">
        {(['amount', 'date'] as SortBy[]).map((key) => (
          <TouchableOpacity
            key={key}
            className={`mx-1 flex-1 rounded-xl px-4 py-2 ${
              sortBy === key ? 'bg-primary' : 'bg-secondary'
            }`}
            onPress={() => setSortBy(key)}>
            <Text
              className={`text-center font-medium ${
                sortBy === key ? 'text-primary-foreground' : 'text-secondary-foreground'
              }`}>
              {key === 'amount' ? 'Amount' : 'Date'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Order: Asc / Desc */}
      <View className="mb-6">
        <Label>Order</Label>
        <View className="flex-row justify-between">
          {(['asc', 'desc'] as SortOrder[]).map((order) => (
            <TouchableOpacity
              key={order}
              className={`mx-1 flex-1 rounded-xl px-4 py-2 ${
                sortOrder === order ? 'bg-primary' : 'bg-secondary'
              }`}
              onPress={() => setSortOrder(order)}>
              <Text
                className={`text-center font-medium ${
                  sortOrder === order ? 'text-primary-foreground' : 'text-secondary-foreground'
                }`}>
                {order === 'asc' ? 'Low → High' : 'High → Low'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Button onPress={() => onClose?.()}>
        <Text>Close</Text>
      </Button>
    </View>
  );
}
