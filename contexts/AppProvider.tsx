import React from 'react';
import { SettingsProvider } from './SettingsContext';
import { ThemeProvider as AppThemeProvider } from './ThemeContext';

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
      <SettingsProvider>{children}</SettingsProvider>
    </AppThemeProvider>
  );
}
