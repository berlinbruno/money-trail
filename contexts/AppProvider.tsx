import React from 'react';
import { AppProvider as AppStateProvider } from './AppContext';
import { DialogProvider } from './DialogProvider';
import { SettingsProvider } from './SettingsContext';
import { ThemeProvider as AppThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Unified app provider that combines all context providers
 * Simplifies the provider hierarchy in the main layout
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppThemeProvider>
      <AppStateProvider>
        <DialogProvider>
          <ToastProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </ToastProvider>
        </DialogProvider>
      </AppStateProvider>
    </AppThemeProvider>
  );
}
