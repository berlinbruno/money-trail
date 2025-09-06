import { View } from 'react-native';
import { Text } from '../ui/text';

export const LegendRow = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) => (
  <View className="flex flex-row items-center gap-2">
    <View className="mr-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
    <Text>{label}</Text>
    <Text className="ml-2 font-bold">{value}</Text>
  </View>
);
