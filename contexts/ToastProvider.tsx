import { Toast, type ToastVariant } from '@/components/ui/toast';
import type { LucideIcon } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.3;

// AnimatedToast component
interface AnimatedToastProps {
  toast: ToastItem;
  onDismiss: () => void;
  isTopmost: boolean; // New prop to determine if this toast is the frontmost
}

const AnimatedToast: React.FC<AnimatedToastProps> = ({ toast, onDismiss, isTopmost }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Only enable gestures for the topmost toast
  const panGesture = Gesture.Pan()
    .enabled(isTopmost) // Conditionally enable gesture
    .onUpdate((event) => {
      if (!isTopmost) return; // Extra safety check
      translateX.value = event.translationX;

      // Reduce opacity as user swipes
      const progress = Math.abs(event.translationX) / DISMISS_THRESHOLD;
      opacity.value = 1 - Math.min(progress * 0.7, 0.7);
    })
    .onEnd((event) => {
      if (!isTopmost) return; // Extra safety check
      const shouldDismiss = Math.abs(event.translationX) > DISMISS_THRESHOLD;

      if (shouldDismiss) {
        // Animate out
        const targetX = event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        translateX.value = withTiming(targetX, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleDismiss)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="w-full">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle} className="relative w-full">
          <Toast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            icon={toast.icon}>
            {toast.children}
          </Toast>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ToastGroup component
interface ToastGroupProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastGroup: React.FC<ToastGroupProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute z-50"
      pointerEvents="box-none"
      style={{
        bottom: 16,
        right: 16,
        minWidth: SCREEN_WIDTH * 0.9,
        maxWidth: SCREEN_WIDTH * 0.9,
      }}>
      {toasts.map((toast, index) => (
        <View
          key={toast.id}
          style={{
            position: 'absolute',
            // Stacked card effect: each toast shows only a small portion behind the previous
            bottom: index * 12, // Small 12px offset to show just the top edge
            right: 0,
            width: '100%',
            // Bottom toast has highest z-index, decreasing upwards
            zIndex: 5 - index, // First toast (bottom): zIndex 5, decreasing to 1 for fifth toast
          }}>
          <AnimatedToast
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
            isTopmost={index === 0} // First toast in array is topmost (highest z-index = 5)
          />
        </View>
      ))}
    </View>
  );
};

// Convenience hooks for different positions and variants

export type ToastPosition = 'bottom-right';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  position: ToastPosition;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  position?: ToastPosition;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
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
  maxToasts?: number;
  defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultDuration = 4000,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  // Effect to manage timing for the topmost toast only
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If there are toasts, set timer for the topmost one
    if (toasts.length > 0) {
      const topmostToast = toasts[0]; // First in array = topmost (highest z-index)
      if (topmostToast.duration && topmostToast.duration > 0) {
        timerRef.current = setTimeout(() => {
          hideToast(topmostToast.id);
        }, topmostToast.duration);
      }
    }

    // Cleanup on unmount or when toasts change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toasts, hideToast]);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = Date.now().toString() + Math.random().toString(36);

      const newToast: ToastItem = {
        id,
        variant: options.variant || 'default',
        title: options.title,
        description: options.description,
        icon: options.icon,
        position: 'bottom-right', // Always bottom-right
        duration: options.duration ?? defaultDuration,
        dismissible: options.dismissible ?? true,
        onDismiss: options.onDismiss,
        children: options.children,
      };

      setToasts((prev) => {
        const newToasts = [...prev, newToast];
        // Limit the number of toasts, removing oldest first
        return newToasts.slice(-maxToasts);
      });

      return id;
    },
    [defaultDuration, maxToasts]
  );

  const hideAllToasts = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((toast) => {
        if (toast.onDismiss) {
          toast.onDismiss();
        }
      });
      return [];
    });
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        hideAllToasts,
      }}>
      {children}

      {/* Toast Container - positioned absolutely at bottom-right */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'box-none',
          zIndex: 9999,
        }}>
        <ToastGroup toasts={toasts} onDismiss={hideToast} />
      </View>
    </ToastContext.Provider>
  );
};

// Convenience hooks for different positions and variants
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    // Variant-based methods (position is always bottom-right)
    showSuccess: (options: Omit<ToastOptions, 'variant'>) =>
      showToast({ ...options, variant: 'default' }),
    showError: (options: Omit<ToastOptions, 'variant'>) =>
      showToast({ ...options, variant: 'destructive' }),
  };
};
