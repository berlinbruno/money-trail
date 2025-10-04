import React, { createContext, useCallback, useContext } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';

export type ToastPosition = 'top' | 'center' | 'bottom';

export interface ToastOptions {
  message: string;
  duration?: 'short' | 'long';
  position?: ToastPosition;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showToast = useCallback((options: ToastOptions | string) => {
    // Handle both string and object inputs
    const message = typeof options === 'string' ? options : options.message;
    const duration = typeof options === 'object' ? options.duration : 'short';
    const position = typeof options === 'object' ? options.position : 'bottom';

    if (Platform.OS === 'android') {
      const toastDuration = duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;

      let gravity = ToastAndroid.BOTTOM;
      if (position === 'top') gravity = ToastAndroid.TOP;
      else if (position === 'center') gravity = ToastAndroid.CENTER;

      ToastAndroid.showWithGravity(message, toastDuration, gravity);
    } else {
      // Fallback for iOS - use Alert
      Alert.alert('Notification', message, [{ text: 'OK' }]);
    }
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
      }}>
      {children}
    </ToastContext.Provider>
  );
};
