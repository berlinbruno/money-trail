import { TRANSACTION_CATEGORIES } from '@/constants/transactionConstants';
import type { FilterState } from '@/types/FilterState';
import { capitalizeFirstLetter } from '@/utils/formatters';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Text } from '../ui/text';

interface FilterFormProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  presets: string[];
  applyPreset: (name: string) => void;
  onClose?: () => void;
}

export default function FilterForm({
  filterState,
  setFilterState,
  presets,
  applyPreset,
  onClose,
}: FilterFormProps) {
  const {
    search,
    type,
    category,
    selectedPreset,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
  } = filterState;

  const handleDateChange = (key: 'startDate' | 'endDate', date: Date | undefined) => {
    if (!date) return;
    setFilterState((prev) => ({
      ...prev,
      [key]: date,
      selectedPreset: '', // deselect preset on manual change
    }));
  };

  const getAvailableCategories = () => {
    if (type === 'credit' || type === 'debit') {
      return TRANSACTION_CATEGORIES[type];
    }
    // For 'all' type, combine both sets
    return [...new Set([...TRANSACTION_CATEGORIES.credit, ...TRANSACTION_CATEGORIES.debit])];
  };

  return (
    <View>
      <Label>Title</Label>
      <Input
        placeholder="Search by title"
        value={search}
        onChangeText={(text) => setFilterState((prev) => ({ ...prev, search: text }))}
      />

      {/* Type Filter */}
      <Label>Type</Label>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {['all', 'debit', 'credit'].map((value) => (
          <TouchableOpacity
            key={value}
            className={`rounded-full px-3 py-2 ${type === value ? 'bg-primary' : 'bg-secondary'}`}
            onPress={() =>
              setFilterState((prev) => ({
                ...prev,
                type: value as FilterState['type'],
                category: 'all', // reset category when type changes
              }))
            }>
            <Text
              className={type === value ? 'text-primary-foreground' : 'text-secondary-foreground'}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <Label>Tags</Label>
      <View className="mb-3 flex-row flex-wrap gap-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            key="all"
            className={`rounded-full px-3 py-2 ${category === 'all' ? 'bg-primary' : 'bg-secondary'}`}
            onPress={() => setFilterState((prev) => ({ ...prev, category: 'all' }))}>
            <Text
              className={
                category === 'all' ? 'text-primary-foreground' : 'text-secondary-foreground'
              }>
              All
            </Text>
          </TouchableOpacity>

          {[...new Set(getAvailableCategories())].map((tag) => (
            <TouchableOpacity
              key={tag}
              className={`rounded-full px-3 py-2 ${category === tag ? 'bg-primary' : 'bg-secondary'}`}
              onPress={() =>
                setFilterState((prev) => ({
                  ...prev,
                  category: tag as typeof category,
                }))
              }>
              <Text
                className={
                  category === tag ? 'text-primary-foreground' : 'text-secondary-foreground'
                }>
                {capitalizeFirstLetter(tag)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Presets */}
      <Label>Preset Ranges</Label>
      <View className="mb-3 flex-row flex-wrap gap-2">
        <TouchableOpacity
          key="all-presets"
          className={`rounded-full px-3 py-2 ${selectedPreset === '' ? 'bg-primary' : 'bg-secondary'}`}
          onPress={() => applyPreset('')}>
          <Text
            className={
              selectedPreset === '' ? 'text-primary-foreground' : 'text-secondary-foreground'
            }>
            All
          </Text>
        </TouchableOpacity>

        {presets.map((preset) => (
          <TouchableOpacity
            key={preset}
            className={`rounded-full px-3 py-2 ${selectedPreset === preset ? 'bg-primary' : 'bg-secondary'}`}
            onPress={() => applyPreset(preset)}>
            <Text
              className={
                selectedPreset === preset ? 'text-primary-foreground' : 'text-secondary-foreground'
              }>
              {preset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Range */}
      <View className="mt-2 flex-row gap-4">
        <View className="flex-1">
          <Label>From:</Label>
          <TouchableOpacity
            onPress={() => setFilterState((prev) => ({ ...prev, showStartPicker: true }))}>
            <Text>{startDate?.toDateString() || 'Select Date'}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()} // fallback to today
              mode="date"
              display="default"
              onChange={(_, date) => {
                if (Platform.OS === 'android') {
                  setFilterState((prev) => ({
                    ...prev,
                    showStartPicker: false,
                  }));
                }
                handleDateChange('startDate', date);
              }}
            />
          )}
        </View>

        <View className="flex-1">
          <Label>To:</Label>
          <TouchableOpacity
            onPress={() => setFilterState((prev) => ({ ...prev, showEndPicker: true }))}>
            <Text>{endDate?.toDateString() || 'Select Date'}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                if (Platform.OS === 'android') {
                  setFilterState((prev) => ({
                    ...prev,
                    showEndPicker: false,
                  }));
                }
                handleDateChange('endDate', date);
              }}
            />
          )}
        </View>
      </View>

      {/* Buttons */}
      <View className="mt-6 flex-row justify-around gap-2">
        <Button
          variant={'secondary'}
          className="flex-1"
          onPress={() => {
            setFilterState({
              search: '',
              type: 'all',
              category: 'all',
              selectedPreset: 'Today',
              startDate: new Date(),
              endDate: new Date(),
              showStartPicker: false,
              showEndPicker: false,
            });
          }}>
          <Text>Reset</Text>
        </Button>
        <Button
          className="flex-1"
          onPress={() => {
            onClose?.();
            setFilterState((prev) => ({
              ...prev,
              showStartPicker: false,
              showEndPicker: false,
            }));
          }}>
          <Text>Close</Text>
        </Button>
      </View>
    </View>
  );
}
