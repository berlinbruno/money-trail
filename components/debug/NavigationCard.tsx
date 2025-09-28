import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export function NavigationCard() {
  return (
    <Card className="m-4 p-4">
      <Text className="mb-4 text-lg font-semibold">Demo Pages</Text>

      <View className="space-y-2">
        <Link href="/toastDemo" asChild>
          <Button variant="outline" className="flex-row items-center justify-start space-x-2">
            <MessageSquare size={16} className="text-foreground" />
            <Text>Simple Toast Demo</Text>
          </Button>
        </Link>

        <Text className="mt-4 text-sm text-muted-foreground">
          Comprehensive toast wrapper with all variants, auto-dismiss, actions, and more!
        </Text>
      </View>
    </Card>
  );
}
