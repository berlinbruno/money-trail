import {
  Alert,
  // Alert,
  AlertFrequency,
  AlertType,
  EditAlert,
  NewAlert,
} from '@/types/Alert';
import { TransactionCategory } from '@/types/Transaction';
import { capitalizeFirstLetter } from '@/utils/formatters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Text } from '../ui/text';

export interface AlertFormProps {
  alert?: Alert;
  availableCategories?: TransactionCategory[];
  currentAlertTypeFrequency: { type: AlertType; frequency: AlertFrequency };
  onSubmit: (alert: NewAlert | EditAlert) => void;
  onClose: () => void;
}

const AlertForm: React.FC<AlertFormProps> = ({
  alert,
  availableCategories = [],
  currentAlertTypeFrequency,
  onSubmit,
  onClose,
}) => {
  const isEditMode = Boolean(alert);

  const [threshold, setThreshold] = useState('');
  const [category, setCategory] = useState<TransactionCategory>(availableCategories[0] || 'Other');

  // Sync defaults
  useEffect(() => {
    if (alert) {
      setThreshold(String(alert.threshold));
      setCategory(alert.category as TransactionCategory);
    } else if (availableCategories && availableCategories.length > 0) {
      setCategory(availableCategories[0]);
    }
  }, [alert, availableCategories]);

  const isValid = useMemo(() => {
    const amt = parseFloat(threshold.trim());
    return !isNaN(amt) && amt > 0 && !!category && availableCategories?.includes(category);
  }, [threshold, category, availableCategories]);

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const amt = parseFloat(threshold.trim());
    const timestamp = new Date().toISOString();
    if (isEditMode && alert) {
      onSubmit({ ...alert, threshold: amt, category, updated_at: timestamp });
    } else {
      onSubmit({
        type: currentAlertTypeFrequency.type,
        frequency: currentAlertTypeFrequency.frequency,
        threshold: amt,
        category,
        created_at: timestamp,
      });
    }
  }, [alert, category, threshold, isValid, onSubmit, currentAlertTypeFrequency, isEditMode]);

  const renderOptions = <T extends string>(
    options: readonly T[],
    selected: T,
    onSelect: (val: T) => void
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          className={`rounded-full px-3 py-2 ${selected === opt ? 'bg-primary' : 'bg-secondary'}`}
          onPress={() => onSelect(opt)}>
          <Text
            className={selected === opt ? 'text-primary-foreground' : 'text-secondary-foreground'}>
            {capitalizeFirstLetter(opt)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View>
      <View className="mb-3">
        <Label>Amount *</Label>
        <Input
          placeholder="e.g. 10000"
          keyboardType="numeric"
          value={threshold}
          onChangeText={setThreshold}
        />
      </View>

      <View className="mb-3">
        <Label>Category *</Label>
        {availableCategories.length === 0 ? (
          <Text className="text-red-500">No categories available</Text>
        ) : (
          renderOptions(availableCategories, category, setCategory)
        )}
      </View>

      <View className="mt-6 flex-row justify-around gap-2">
        <Button className="flex-[2]" onPress={handleSave} disabled={!isValid}>
          <Text>Save</Text>
        </Button>
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
};

export default AlertForm;
