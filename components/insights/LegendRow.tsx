import { View } from 'react-native';
import { Label } from '../ui/label';
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
    <Label>{label}</Label>
    <Text className="ml-2" variant={'small'}>
      {value}
    </Text>
  </View>
);
