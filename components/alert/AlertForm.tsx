import { Alert, AlertFrequency, AlertType, EditAlert, NewAlert } from '@/types/Alert';
import { TransactionCategory } from '@/types/Transaction';
import { capitalizeFirstLetter } from '@/utils/formatterUtils';
import { useTheme } from '@react-navigation/native';
import { Loader2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, TouchableOpacity, View } from 'react-native';
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
  isLoading?: boolean;
}

const AlertForm: React.FC<AlertFormProps> = ({
  alert,
  availableCategories = [],
  currentAlertTypeFrequency,
  onSubmit,
  onClose,
  isLoading: externalLoading,
}) => {
  const isEditMode = Boolean(alert);
  const theme = useTheme();

  const [threshold, setThreshold] = useState('');
  const [category, setCategory] = useState<TransactionCategory>(availableCategories[0] || 'Other');
  const [internalLoading, setInternalLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Use external loading state if provided, otherwise use internal
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Handle keyboard height for dynamic bottom margin
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Sync defaults
  useEffect(() => {
    // Reset loading state when alert changes
    setInternalLoading(false);

    if (alert) {
      setThreshold(String(alert.threshold));
      setCategory(alert.category as TransactionCategory);
    } else if (availableCategories && availableCategories.length > 0) {
      setCategory(availableCategories[0]);
    }
  }, [alert, availableCategories]);

  const isValid = useMemo(() => {
    const amt = parseFloat(threshold.trim());
    const isAmountValid = !isNaN(amt) && amt > 0;
    const isCategoryValid =
      !!category &&
      (isEditMode || // In edit mode, allow existing category
        availableCategories?.includes(category)); // In create mode, category must be in available list

    // Check if values have changed from original (only in edit mode)
    const hasChanges =
      isEditMode && alert ? amt !== alert.threshold || category !== alert.category : true; // Always allow save in create mode

    return isAmountValid && isCategoryValid && hasChanges;
  }, [threshold, category, availableCategories, isEditMode, alert]);

  const handleSave = useCallback(() => {
    if (!isValid) return;

    // Only set internal loading if no external loading is provided
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }

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

      // Only reset internal loading if no external loading is provided
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  }, [
    alert,
    category,
    threshold,
    isValid,
    onSubmit,
    currentAlertTypeFrequency,
    isEditMode,
    externalLoading,
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          marginBottom: keyboardHeight > 0 ? keyboardHeight : 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={false}>
        <View className="flex-1 p-2">
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}>
                {availableCategories.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    className={`rounded-full px-3 py-2 ${
                      category === opt ? 'bg-primary' : 'bg-secondary'
                    }`}
                    onPress={() => setCategory(opt)}>
                    <Text
                      className={
                        category === opt ? 'text-primary-foreground' : 'text-secondary-foreground'
                      }>
                      {capitalizeFirstLetter(opt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View className="mt-6 flex-row justify-around gap-2">
            <Button className="flex-[2]" onPress={handleSave} disabled={!isValid || isLoading}>
              {isLoading ? (
                <View className="flex-row items-center">
                  <View className="mr-2 animate-spin">
                    <Loader2 size={16} color={theme.colors.text} />
                  </View>
                  <Text className="text-primary-foreground">
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </Text>
                </View>
              ) : (
                <Text>{isEditMode ? 'Update' : 'Save'}</Text>
              )}
            </Button>
            <Button variant="secondary" className="flex-1" onPress={onClose} disabled={isLoading}>
              <Text>Cancel</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AlertForm;
