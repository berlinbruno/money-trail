import {
  ConfirmationDialog,
  ConfirmationDialogProps,
  PermissionDialog,
} from '@/components/dialogs';
import {
  createPermissionDialogProps,
  hasSMSPermission,
  requestAppPermissions,
} from '@/utils/permissionUtils';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ConfirmationDialogProps['confirmVariant'];
  loadingText?: string;
  onConfirm: () => void | Promise<void>;
}

interface PermissionDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  showSettingsButton: boolean;
  isBlocking: boolean;
}

interface DialogContextType {
  // Permission dialog methods
  checkSMSPermissionWithDialog: () => Promise<boolean>;
  requestSMSPermissionWithDialog: () => Promise<boolean>;
  showPermissionDialog: (config: {
    title: string;
    description: string;
    showSettingsButton?: boolean;
    isBlocking?: boolean;
  }) => void;

  // Confirmation dialog methods
  showConfirmationDialog: (config: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: ConfirmationDialogProps['confirmVariant'];
    loadingText?: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

// Alias for the main hook
export const useDialogContext = useDialog;

// Legacy export for backward compatibility
export const usePermissionDialogContext = () => {
  const context = useDialog();
  return {
    checkSMSPermissionWithDialog: context.checkSMSPermissionWithDialog,
    requestSMSPermissionWithDialog: context.requestSMSPermissionWithDialog,
    showPermissionDialog: context.showPermissionDialog,
  };
};

interface DialogProviderProps {
  children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  // Permission dialog state
  const [permissionDialogState, setPermissionDialogState] = useState<PermissionDialogState>({
    isOpen: false,
    title: '',
    description: '',
    showSettingsButton: false,
    isBlocking: false,
  });

  // Confirmation dialog state
  const [confirmationDialogState, setConfirmationDialogState] = useState<ConfirmationDialogState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showPermissionDialog = useCallback(
    (config: {
      title: string;
      description: string;
      showSettingsButton?: boolean;
      isBlocking?: boolean;
    }) => {
      setPermissionDialogState({
        isOpen: true,
        title: config.title,
        description: config.description,
        showSettingsButton: config.showSettingsButton ?? true,
        isBlocking: config.isBlocking ?? false,
      });
    },
    []
  );

  const hidePermissionDialog = useCallback(() => {
    setPermissionDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * Check if SMS permission is granted, show dialog if not
   * @returns Promise<boolean> - true if permission is granted
   */
  const checkSMSPermissionWithDialog = useCallback(async (): Promise<boolean> => {
    const hasPermission = await hasSMSPermission();

    if (!hasPermission) {
      showPermissionDialog({
        title: 'SMS Permission Required',
        description:
          'This feature requires SMS access to automatically track transactions from banking messages. You can grant permission in app settings or continue without this feature.',
        showSettingsButton: true,
        isBlocking: false,
      });
      return false;
    }

    return true;
  }, [showPermissionDialog]);

  /**
   * Request SMS permission with dialog feedback
   * @returns Promise<boolean> - true if permission was granted
   */
  const requestSMSPermissionWithDialog = useCallback(async (): Promise<boolean> => {
    try {
      const results = await requestAppPermissions();
      const dialogProps = createPermissionDialogProps(results);

      if (dialogProps) {
        showPermissionDialog(dialogProps);
        return false;
      }

      // Permission was granted
      return true;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      showPermissionDialog({
        title: 'Permission Error',
        description:
          'There was an error requesting SMS permission. Please try again or grant permission manually in app settings.',
        showSettingsButton: true,
        isBlocking: false,
      });
      return false;
    }
  }, [showPermissionDialog]);

  const showConfirmationDialog = useCallback(
    (config: {
      title: string;
      description: string;
      confirmText?: string;
      cancelText?: string;
      confirmVariant?: ConfirmationDialogProps['confirmVariant'];
      loadingText?: string;
      onConfirm: () => void | Promise<void>;
    }) => {
      setConfirmationDialogState({
        isOpen: true,
        title: config.title,
        description: config.description,
        confirmText: config.confirmText,
        cancelText: config.cancelText,
        confirmVariant: config.confirmVariant,
        loadingText: config.loadingText,
        onConfirm: config.onConfirm,
      });
    },
    []
  );

  const hideConfirmationDialog = useCallback(() => {
    setConfirmationDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <DialogContext.Provider
      value={{
        checkSMSPermissionWithDialog,
        requestSMSPermissionWithDialog,
        showPermissionDialog,
        showConfirmationDialog,
      }}>
      {children}
      <PermissionDialog
        open={permissionDialogState.isOpen}
        onOpenChange={hidePermissionDialog}
        title={permissionDialogState.title}
        description={permissionDialogState.description}
        showSettingsButton={permissionDialogState.showSettingsButton}
        isBlocking={permissionDialogState.isBlocking}
      />
      <ConfirmationDialog
        open={confirmationDialogState.isOpen}
        onOpenChange={hideConfirmationDialog}
        title={confirmationDialogState.title}
        description={confirmationDialogState.description}
        confirmText={confirmationDialogState.confirmText}
        cancelText={confirmationDialogState.cancelText}
        confirmVariant={confirmationDialogState.confirmVariant}
        loadingText={confirmationDialogState.loadingText}
        onConfirm={confirmationDialogState.onConfirm}
      />
    </DialogContext.Provider>
  );
}

// Legacy export for backward compatibility
export const PermissionDialogProvider = DialogProvider;
