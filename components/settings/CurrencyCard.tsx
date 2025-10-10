import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { CURRENCY_OPTIONS, CURRENCY_PREVIEW_AMOUNT } from '@/constants/settingsConstants';
import { formatCurrencyLabel } from '@/utils/formatterUtils';
import React from 'react';
import { View } from 'react-native';

interface CurrencyCardProps {
  selectedCurrency: {
    code: string;
    symbol: string;
    name: string;
  };
  onCurrencyChange: (option: Option) => void;
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({
  selectedCurrency,
  onCurrencyChange,
}) => {
  // Convert currency to Option format for Select component
  const currencyOption = {
    value: selectedCurrency.code,
    label: formatCurrencyLabel(selectedCurrency),
  };

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Currency Format</CardTitle>
        <CardDescription>Select your preferred currency display format</CardDescription>
      </CardHeader>
      <CardContent>
        <View className="mb-3">
          <Text className="mb-2 font-medium">Currency</Text>
          <Text className="mb-3 text-sm text-muted-foreground">
            Choose how amounts are displayed in the app
          </Text>
          <Select value={currencyOption} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((currency) => (
                <SelectItem
                  key={currency.code}
                  value={currency.code}
                  label={formatCurrencyLabel(currency)}>
                  <Text>{formatCurrencyLabel(currency)}</Text>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        <View className="border-t border-border pt-3">
          <Text className="mb-2 font-medium">Preview</Text>
          <View className="rounded-lg bg-muted p-3">
            <Text className="text-sm text-muted-foreground">Sample amount:</Text>
            <Text className="text-lg font-semibold">
              {selectedCurrency.symbol}
              {CURRENCY_PREVIEW_AMOUNT}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};
