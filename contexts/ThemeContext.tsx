import * as ThemeChanger from 'expo-theme-changer';
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Constants
const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

// Types
export type ThemeType = ThemeChanger.Theme;
export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  // Current theme state
  theme: ThemeType;
  colorScheme: ColorScheme;
  isThemeLoading: boolean;

  // Actions
  setTheme: (theme: ThemeType) => Promise<void>;
}

// Context creation
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Theme Provider Component
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>(() => ThemeChanger.getTheme());
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() =>
    ThemeChanger.getEffectiveTheme()
  );
  const { setColorScheme } = useColorScheme();
  const previousColorSchemeRef = useRef<ColorScheme | null>(null);

  // Memoized function to apply color scheme to NativeWind
  const applyColorScheme = useCallback(
    (newColorScheme: ColorScheme) => {
      requestAnimationFrame(() => {
        setColorScheme(newColorScheme);
      });
    },
    [setColorScheme]
  );

  // Apply the color scheme to NativeWind whenever it changes
  useEffect(() => {
    // Only update if the color scheme actually changed to prevent unnecessary calls
    if (previousColorSchemeRef.current !== colorScheme) {
      previousColorSchemeRef.current = colorScheme;
      applyColorScheme(colorScheme);
    }
  }, [colorScheme, applyColorScheme]);

  // Listen for theme changes from the native module
  useEffect(() => {
    const subscription = ThemeChanger.addThemeListener(({ theme: newTheme, effectiveTheme }) => {
      setThemeState(newTheme);
      setColorSchemeState(effectiveTheme);
    });

    return () => subscription.remove();
  }, []);

  // Set theme function - delegates to native module
  const setTheme = useCallback(async (newTheme: ThemeType) => {
    try {
      // Update native module (this persists automatically)
      ThemeChanger.setTheme(newTheme);

      // State updates will be handled by the theme listener
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  }, []);

  // Initialize color scheme on mount
  useEffect(() => {
    const effectiveTheme = ThemeChanger.getEffectiveTheme();
    applyColorScheme(effectiveTheme);
  }, [applyColorScheme]);

  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    isThemeLoading: false, // Native module loads instantly, no loading state needed
    setTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export theme options for use in components
export { THEME_OPTIONS };
