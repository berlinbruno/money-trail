import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';

interface DataManagementCardProps {
  onGenerateTestTransactions: () => void;
  onGenerateTestAlerts: () => void;
  onClearAllData: () => void;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({
  onGenerateTestTransactions,
  onGenerateTestAlerts,
  onClearAllData,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Text className="mb-2 text-sm font-medium">Generate Test Data:</Text>
        <Button className="mb-2" onPress={onGenerateTestTransactions}>
          <Text>Generate Test Transactions</Text>
        </Button>
        <Button className="mb-2" onPress={onGenerateTestAlerts}>
          <Text>Generate Test Alerts</Text>
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
