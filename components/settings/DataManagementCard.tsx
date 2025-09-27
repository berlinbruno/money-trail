import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';

interface DataManagementCardProps {
  onExportData: () => void;
  onImportData: () => void;
  onResetData: () => void;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({
  onExportData,
  onImportData,
  onResetData,
}) => {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Import, export, or reset your data</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="mb-2 w-full" variant="outline" onPress={onExportData}>
          <Text>Export Data</Text>
        </Button>
        <Button className="mb-2 w-full" variant="outline" onPress={onImportData}>
          <Text>Import Data</Text>
        </Button>
        <Button className="w-full" variant="destructive" onPress={onResetData}>
          <Text>Reset All Data</Text>
        </Button>
        <Text className="mt-2 text-center text-xs italic text-muted-foreground">
          Export your data before resetting
        </Text>
      </CardContent>
    </Card>
  );
};
