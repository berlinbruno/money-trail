import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ConfigRecordsCardProps {
  configRecords: { key: string; value: string }[];
  onConfigDetail?: (config: { key: string; value: string }) => void;
}

export const ConfigRecordsCard: React.FC<ConfigRecordsCardProps> = ({
  configRecords,
  onConfigDetail,
}) => {
  if (configRecords.length === 0) return null;

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Config Records</CardTitle>
        {onConfigDetail && <CardDescription>(Tap on a record to see full details)</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Header Row */}
        <View className="flex-row border-b-2 border-border bg-muted">
          <Text className="flex-1 p-2 font-bold">Key</Text>
          <Text className="flex-1 p-2 font-bold">Value</Text>
        </View>

        {/* Data Rows */}
        {configRecords.map((item, index) => {
          const RowComponent = onConfigDetail ? TouchableOpacity : View;
          return (
            <RowComponent
              key={index}
              className="flex-row border-b border-border"
              {...(onConfigDetail && { onPress: () => onConfigDetail(item) })}>
              <View className="flex-1 p-2">
                <Text className="font-medium">{item.key}</Text>
              </View>
              <View className="flex-1 p-2">
                <Text className="text-muted-foreground" numberOfLines={2} ellipsizeMode="tail">
                  {item.value}
                </Text>
              </View>
            </RowComponent>
          );
        })}
      </CardContent>
    </Card>
  );
};
