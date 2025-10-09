import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@react-navigation/native';
import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

interface TransactionToolbarProps {
  actions: ToolbarAction[];
  style?: ViewStyle;
}

/**
 * Configurable bottom toolbar for transaction screens
 * Supports 2-3 actions with icons and labels
 */
export default function TransactionToolbar({ actions, style }: TransactionToolbarProps) {
  const theme = useTheme();

  return (
    <View className="flex-row border-t border-border bg-card" style={[style]}>
      {actions.map((action, index) => (
        <React.Fragment key={action.label}>
          <Button
            variant="ghost"
            onPress={action.onPress}
            className="flex-1 flex-row gap-2 rounded-none">
            <action.icon color={theme.colors.text} size={18} />
            <Text className="text-sm font-medium">{action.label}</Text>
          </Button>

          {/* Separator line between buttons */}
          {index < actions.length - 1 && <View className="w-px bg-border" />}
        </React.Fragment>
      ))}
    </View>
  );
}
