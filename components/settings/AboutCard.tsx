import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface AboutCardProps {
  appVersion: string;
}

export const AboutCard: React.FC<AboutCardProps> = ({ appVersion }) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-between py-2">
          <Text className="font-medium">App Version:</Text>
          <Text className="text-primary">{appVersion}</Text>
        </View>
      </CardContent>
    </Card>
  );
};
