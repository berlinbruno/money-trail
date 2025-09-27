import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface DatabaseInfoCardProps {
  dbInfo: { table: string; count: number }[];
}

export const DatabaseInfoCard: React.FC<DatabaseInfoCardProps> = ({ dbInfo }) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Database Information</CardTitle>
      </CardHeader>
      <CardContent>
        {dbInfo.map((item, index) => (
          <View key={index} className="flex-row justify-between border-b border-border py-2">
            <Text className="flex-1 font-medium">{item.table}</Text>
            <Text className="text-primary">{item.count} records</Text>
          </View>
        ))}
      </CardContent>
    </Card>
  );
};
