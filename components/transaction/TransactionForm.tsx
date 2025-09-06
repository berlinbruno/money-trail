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
import { capitalizeFirstLetter } from '@/utils/formatters';
import { getTransactionHash } from '@/utils/hash';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
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
  const isEditMode = !!transaction;

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [mode, setMode] = useState<TransactionMode>('other');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync state on edit
  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setTitle(transaction.title);
      setType(transaction.type);
      setCategory(transaction.category);
      setMode(transaction.mode ?? 'other');
      setDate(transaction.date ? new Date(transaction.date) : new Date());
    } else {
      setCategory(type === 'credit' ? CREDIT_CATEGORIES[0] : DEBIT_CATEGORIES[0]);
    }
  }, [transaction]);

  const isValid = useMemo(() => {
    const amt = parseFloat(amount.trim());
    return (
      !isNaN(amt) &&
      amt > 0 &&
      title.trim().length > 0 &&
      category &&
      mode &&
      (type === 'credit'
        ? CREDIT_CATEGORIES.includes(category as CreditCategory)
        : DEBIT_CATEGORIES.includes(category as DebitCategory)) &&
      TRANSACTION_MODES.includes(mode)
    );
  }, [amount, title, category, mode, type]);

  const handleSave = useCallback(() => {
    if (!isValid) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    const timestamp = date.toISOString();

    if (isEditMode) {
      onSubmit({
        ...(transaction as EditTransaction),
        account: 'default',
        type,
        amount: parseFloat(amount),
        category,
        mode,
        title: capitalizeFirstLetter(title),
        date: timestamp,
        source: 'manual',
        updated_at: timestamp,
        pending_approval: 0,
      });
    } else {
      onSubmit({
        account: 'default',
        type,
        amount: parseFloat(amount),
        category,
        mode,
        title: capitalizeFirstLetter(title),
        source: 'manual',
        date: timestamp,
        created_at: timestamp,
        pending_approval: 0,
        sms_hash: getTransactionHash(title, amount, date, 'default').toString(),
      });
    }
  }, [amount, title, category, mode, type, isValid, isEditMode, onSubmit, transaction, date]);

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
            setCategory(val === 'credit' ? CREDIT_CATEGORIES[0] : DEBIT_CATEGORIES[0]);
          })}
        </View>

        <View className="flex-1">
          <Label>Date *</Label>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text className="py-2 text-sm text-blue-500">{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
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
        <Button className="flex-[2]" onPress={handleSave} disabled={!isValid}>
          <Text>Save</Text>
        </Button>
        <Button variant="secondary" className="flex-1" onPress={onCancel}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
};

export default TransactionForm;
