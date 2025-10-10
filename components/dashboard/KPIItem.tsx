import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface KPIItemProps {
  title: string;
  value: string;
  color: string;
}

export function KPIItem({ title, value, color }: KPIItemProps) {
  return (
    <View className="items-center">
      <Text>{title}</Text>
      <Text style={{ color }}>{value}</Text>
    </View>
  );
}
