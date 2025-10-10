import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { THEME_OPTIONS } from '@/contexts/ThemeContext';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface AppearanceCardProps {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
}

export const AppearanceCard: React.FC<AppearanceCardProps> = ({ selectedTheme, onThemeChange }) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <Text className="mb-2 font-medium">Theme</Text>
        <CardDescription>Select light, dark, or system theme</CardDescription>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {THEME_OPTIONS.map((theme) => (
            <TouchableOpacity
              key={theme}
              className={`rounded-full px-3 py-2 ${
                selectedTheme === theme ? 'bg-primary' : 'bg-secondary'
              }`}
              onPress={() => onThemeChange(theme)}>
              <Text
                className={
                  selectedTheme === theme ? 'text-primary-foreground' : 'text-secondary-foreground'
                }>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </CardContent>
    </Card>
  );
};
