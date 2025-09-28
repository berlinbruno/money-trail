import { getSettingsValue, setSettingsValue } from '@/utils/asyncStorageHelpers';
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Appearance, AppState } from 'react-native';

// Constants
const THEME_STORAGE_KEY = 'app_theme'; // Use consistent key with asyncStorageHelpers
const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

// Types
export type ThemeType = (typeof THEME_OPTIONS)[number];
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
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(() => {
    return Appearance.getColorScheme() || 'light';
  });
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const { setColorScheme } = useColorScheme();
  const previousColorSchemeRef = useRef<ColorScheme | null>(null);

  // Calculate the effective color scheme based on current theme and system preference
  const colorScheme: ColorScheme = React.useMemo(() => {
    switch (theme) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
        return systemColorScheme;
      default:
        return 'light';
    }
  }, [theme, systemColorScheme]);

  // Memoized function to apply color scheme to avoid render-time issues
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

  // Load theme from storage on app initialization
  const loadThemeFromStorage = useCallback(async () => {
    try {
      setIsThemeLoading(true);

      const storedTheme = await getSettingsValue(THEME_STORAGE_KEY);

      if (storedTheme && THEME_OPTIONS.includes(storedTheme as ThemeType)) {
        setThemeState(storedTheme as ThemeType);
      } else {
        // First time app launch - detect system theme and save as default
        setThemeState('system');
        await setSettingsValue(THEME_STORAGE_KEY, 'system');
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
      // Fallback to system theme
      setThemeState('system');
    } finally {
      setIsThemeLoading(false);
    }
  }, []);

  // Save theme to storage
  const saveThemeToStorage = useCallback(async (newTheme: ThemeType) => {
    try {
      await setSettingsValue(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
      throw error;
    }
  }, []);

  // Set theme function
  const setTheme = useCallback(
    async (newTheme: ThemeType) => {
      try {
        // Update state immediately for UI responsiveness
        setThemeState(newTheme);

        // Save to storage
        await saveThemeToStorage(newTheme);

        // If switching to system theme, immediately get current system color scheme
        if (newTheme === 'system') {
          const currentSystemScheme = Appearance.getColorScheme() || 'light';
          setSystemColorScheme(currentSystemScheme);
        }
      } catch (error) {
        console.error('Error setting theme:', error);
        throw error;
      }
    },
    [saveThemeToStorage]
  );

  // Initialize theme on app start
  useEffect(() => {
    loadThemeFromStorage();
  }, [loadThemeFromStorage]);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      const newScheme = newColorScheme || 'light';
      setSystemColorScheme(newScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Re-check system theme when app becomes active (handles background changes)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const currentSystemScheme = Appearance.getColorScheme() || 'light';
        setSystemColorScheme(currentSystemScheme);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    isThemeLoading,
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
