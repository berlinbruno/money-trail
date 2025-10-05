import {
  CREDIT_CATEGORIES,
  DEBIT_CATEGORIES,
  TRANSACTION_MODES,
  TRANSACTION_TYPE,
} from '@/constants/transactionConstants';
import {
  CreditCategory,
  DebitCategory,
  EditTransaction,
  NewTransaction,
  Transaction,
  TransactionCategory,
  TransactionMode,
  TransactionType,
} from '@/types/Transaction';
import { getTransactionHash } from '@/utils/cryptoUtils';
import { capitalizeFirstLetter } from '@/utils/formatterUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import { Loader2 } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Text } from '../ui/text';

interface Props {
  transaction?: Transaction;
  onSubmit: (transaction: NewTransaction | EditTransaction) => void;
  onCancel?: () => void;
}

const TransactionForm: React.FC<Props> = ({ transaction, onSubmit, onCancel }) => {
  const isEditMode = Boolean(transaction);
  const theme = useTheme();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [mode, setMode] = useState<TransactionMode>('other');
  const [date, setDate] = useState(() => new Date()); // Use function to ensure consistent initial value
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Memoize today's date to prevent new Date() on every render
  const maxDate = useMemo(() => new Date(), []);

  // Memoize theme colors to prevent re-renders from theme changes
  const themeColors = useMemo(() => theme.colors.text, [theme.colors.text]);

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

  // Sync state on edit - only when transaction changes, not when user changes type
  useEffect(() => {
    // Reset loading state when transaction changes
    setIsLoading(false);

    if (transaction) {
      setAmount(String(transaction.amount));
      setTitle(transaction.title);
      setType(transaction.type);
      setCategory(transaction.category);
      setMode(transaction.mode ?? 'other');
      // Only set date if transaction has a valid date, don't reset to current date
      if (transaction.date) {
        setDate(new Date(transaction.date));
      }
      // If no transaction.date, keep the existing date state (don't reset to current date)
    }
    // For new transactions (no transaction), keep all existing form state including date
  }, [transaction]); // Use full transaction dependency

  // Separate effect to handle category reset when type changes for new transactions
  useEffect(() => {
    if (!transaction) {
      // Only auto-set category for new transactions
      setCategory(type === 'credit' ? CREDIT_CATEGORIES[0] : DEBIT_CATEGORIES[0]);
    }
  }, [type, transaction]);

  const isValid = useMemo(() => {
    const amt = parseFloat(amount.trim());
    const isFormValid =
      !isNaN(amt) &&
      amt > 0 &&
      title.trim().length > 0 &&
      category &&
      mode &&
      (type === 'credit'
        ? CREDIT_CATEGORIES.includes(category as CreditCategory)
        : DEBIT_CATEGORIES.includes(category as DebitCategory)) &&
      TRANSACTION_MODES.includes(mode);

    // Check if values have changed from original (only in edit mode)
    const hasChanges =
      isEditMode && transaction
        ? amt !== transaction.amount ||
          title.trim() !== transaction.title ||
          type !== transaction.type ||
          category !== transaction.category ||
          mode !== (transaction.mode ?? 'other') ||
          (transaction.date && date.toISOString() !== new Date(transaction.date).toISOString())
        : true; // Always allow save in create mode

    return isFormValid && hasChanges;
  }, [amount, title, category, mode, type, date, isEditMode, transaction]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    try {
      setIsLoading(true);
      const timestamp = date.toISOString();
      const smsHash = await getTransactionHash(title, amount, date, 'default');

      if (transaction) {
        // Update existing transaction
        onSubmit({
          ...transaction,
          amount: parseFloat(amount),
          category,
          mode,
          title: capitalizeFirstLetter(title),
          type,
          date: timestamp,
          updated_at: new Date().toISOString(),
          source: transaction.source || 'manual',
        });
      } else {
        // Create new transaction
        onSubmit({
          amount: parseFloat(amount),
          account: 'default',
          category,
          type,
          mode,
          title: capitalizeFirstLetter(title),
          source: 'manual',
          date: timestamp,
          created_at: timestamp,
          pending_approval: 0,
          sms_hash: smsHash,
        });
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'An error occurred while saving the transaction.');
      setIsLoading(false);
    }
  }, [amount, title, category, mode, type, isValid, date, transaction, onSubmit]);

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
              placeholder="e.g. 1200"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View className="mb-3">
            <Label>Title *</Label>
            <Input placeholder="e.g. Grocery shopping" value={title} onChangeText={setTitle} />
          </View>

          <View className="mb-3 flex-row flex-wrap gap-3">
            <View className="flex-1">
              <Label>Type *</Label>
              {renderOptions<TransactionType>(TRANSACTION_TYPE, type, (val) => {
                setType(val);
                // When type changes, update category to first valid option for new type
                const newCategory = val === 'credit' ? CREDIT_CATEGORIES[0] : DEBIT_CATEGORIES[0];
                setCategory(newCategory);
              })}
            </View>

            <View className="flex-1">
              <Label>Date *</Label>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text className="py-2 text-sm">{date.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'default' : 'default'}
                  maximumDate={maxDate}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false); // Always close picker
                    if (event.type === 'set' && selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>

          <View className="mb-3">
            <Label>Category *</Label>
            {renderOptions<TransactionCategory>(
              type === 'credit' ? CREDIT_CATEGORIES : DEBIT_CATEGORIES,
              category,
              setCategory
            )}
          </View>

          <View className="mb-3">
            <Label>Mode *</Label>
            {renderOptions<TransactionMode>(TRANSACTION_MODES, mode, setMode)}
          </View>

          <View className="mt-6 flex-row justify-around gap-2">
            <Button className="flex-[2]" onPress={handleSubmit} disabled={!isValid || isLoading}>
              {isLoading ? (
                <View className="flex-row items-center">
                  <View className="mr-2 animate-spin">
                    <Loader2 size={16} color={themeColors} />
                  </View>
                  <Text className="text-primary-foreground">
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </Text>
                </View>
              ) : (
                <Text>{isEditMode ? 'Update' : 'Save'}</Text>
              )}
            </Button>
            <Button variant="secondary" className="flex-1" onPress={onCancel} disabled={isLoading}>
              <Text>Cancel</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: Props, nextProps: Props): boolean => {
  // Only re-render if transaction prop actually changes
  const transactionChanged =
    prevProps.transaction?.id !== nextProps.transaction?.id ||
    prevProps.transaction?.amount !== nextProps.transaction?.amount ||
    prevProps.transaction?.title !== nextProps.transaction?.title ||
    prevProps.transaction?.type !== nextProps.transaction?.type ||
    prevProps.transaction?.category !== nextProps.transaction?.category ||
    prevProps.transaction?.mode !== nextProps.transaction?.mode ||
    prevProps.transaction?.date !== nextProps.transaction?.date;

  // Only re-render if transaction changed (ignore function prop changes)
  return !transactionChanged;
};

export default memo(TransactionForm, arePropsEqual);
