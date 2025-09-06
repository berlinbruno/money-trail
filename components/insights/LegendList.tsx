import { View } from 'react-native';
import LegendItem from './LegendItem';

export default function LegendList({
  data,
  total,
  prefix,
}: {
  data: any[];
  total: number;
  prefix: string;
}) {
  if (!data.length) return null;
  return (
    <View className="h-full w-full flex-1 flex-row flex-wrap justify-start">
      {data.map((item, index) => {
        const percent = total ? ((item.value / total) * 100).toFixed(1) : '0.0';
        return (
          <LegendItem
            key={`${prefix}-${index}`}
            color={item.color}
            label={item.category}
            percent={percent}
          />
        );
      })}
    </View>
  );
}
