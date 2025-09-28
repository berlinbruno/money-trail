import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';

interface DataManagementCardProps {
  onGenerateTestData: () => void;
  onClearAllData: () => void;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({
  onGenerateTestData,
  onClearAllData,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-2" onPress={onGenerateTestData}>
          <Text>Generate Test Data</Text>
        </Button>
        <Button variant="destructive" onPress={onClearAllData}>
          <Text>Reset All Data</Text>
        </Button>
        <Text className="mt-1 text-center text-xs italic text-destructive">
          (Clears records & resets settings to defaults)
        </Text>
      </CardContent>
    </Card>
  );
};
