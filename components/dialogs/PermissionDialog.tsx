import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { openAppSettings } from '@/utils/permissionUtils';
import React from 'react';

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  showSettingsButton: boolean;
  isBlocking: boolean;
}

export function PermissionDialog({
  open,
  onOpenChange,
  title,
  description,
  showSettingsButton,
  isBlocking,
}: PermissionDialogProps) {
  const handleOpenSettings = async () => {
    const success = await openAppSettings();
    if (!success) {
      // Could show a toast here if needed
      console.warn('Could not open settings');
    }
    onOpenChange(false);
  };

  const handleContinue = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Text>{title}</Text>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Text>{description}</Text>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isBlocking && (
            <AlertDialogCancel onPress={handleContinue}>
              <Text>Continue</Text>
            </AlertDialogCancel>
          )}
          {showSettingsButton && (
            <AlertDialogAction onPress={handleOpenSettings}>
              <Text>Open Settings</Text>
            </AlertDialogAction>
          )}
          {isBlocking && !showSettingsButton && (
            <AlertDialogAction onPress={handleContinue}>
              <Text>OK</Text>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
