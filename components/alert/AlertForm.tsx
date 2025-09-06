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
import { useTheme } from '@react-navigation/native';
import { Loader2 } from 'lucide-react-native';
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
  const theme = useTheme();

  const [threshold, setThreshold] = useState('');
  const [category, setCategory] = useState<TransactionCategory>(availableCategories[0] || 'Other');
  const [isLoading, setIsLoading] = useState(false);

  // Sync defaults
  useEffect(() => {
    // Reset loading state when alert changes
    setIsLoading(false);

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

    setIsLoading(true);
    const amt = parseFloat(threshold.trim());
    const timestamp = new Date().toISOString();

    try {
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
    } catch (error) {
      console.error('Error saving alert:', error);
      setIsLoading(false);
    }
  }, [
    alert,
    category,
    threshold,
    isValid,
    onSubmit,
    currentAlertTypeFrequency,
    isEditMode,
    setIsLoading,
  ]);

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
        <Button className="flex-[2]" onPress={handleSave} disabled={!isValid || isLoading}>
          {isLoading ? (
            <View className="flex-row items-center">
              <View className="mr-2 animate-spin">
                <Loader2 size={16} color={theme.colors.text} />
              </View>
              <Text className="text-primary-foreground">Saving...</Text>
            </View>
          ) : (
            <Text>Save</Text>
          )}
        </Button>
        <Button variant="secondary" className="flex-1" onPress={onClose} disabled={isLoading}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
};

export default AlertForm;
