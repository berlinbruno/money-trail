import { useTheme } from '@react-navigation/native';
import { Loader2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';
import { Text } from './text';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'static';
  onConfirm: () => void | Promise<void>;
  loadingText?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
  onConfirm,
  loadingText = 'Processing...',
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      // Only close dialog if the operation was successful
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Don't close dialog on error, let user retry or cancel
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            <Text>{cancelText}</Text>
          </AlertDialogCancel>
          <Button variant={confirmVariant} onPress={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <View className="flex-row items-center">
                <View className="mr-2 animate-spin">
                  <Loader2 size={16} color={theme.colors.text} />
                </View>
                <Text className="text-primary-foreground">{loadingText}</Text>
              </View>
            ) : (
              <Text>{confirmText}</Text>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
