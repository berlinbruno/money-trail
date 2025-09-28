import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LucideIcon } from 'lucide-react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import React from 'react';
import { type ViewProps } from 'react-native';

export type ToastVariant = 'default' | 'destructive';

export interface ToastProps extends Omit<ViewProps, 'children'> {
  /** The toast variant that determines styling and icon */
  variant?: ToastVariant;
  /** The main title of the toast */
  title?: string;
  /** The description/message of the toast */
  description?: string;
  /** Custom icon to override the default variant icon */
  icon?: LucideIcon;
  /** Custom className for styling */
  className?: string;
  /** Additional custom content */
  children?: React.ReactNode;
}

export function Toast({
  variant = 'default',
  title,
  description,
  icon,
  className,
  children,
  ...props
}: ToastProps) {
  const defaultIcon = variant === 'destructive' ? XCircle : CheckCircle;
  const IconComponent = icon || defaultIcon;

  return (
    <Alert icon={IconComponent} variant={variant} className={className} {...props}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
      {children}
    </Alert>
  );
}
