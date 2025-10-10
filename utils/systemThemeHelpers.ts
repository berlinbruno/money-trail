import { Appearance } from 'react-native';

/**
 * Gets the current system theme
 * @returns 'light' | 'dark'
 */
export const getCurrentSystemTheme = (): 'light' | 'dark' => {
  return Appearance.getColorScheme() || 'light';
};

/**
 * Checks if the system supports dark mode
 * @returns boolean
 */
export const isSystemDarkModeSupported = (): boolean => {
  return Appearance.getColorScheme() !== null;
};

/**
 * Gets detailed system theme information
 * @returns object with theme details
 */
export const getSystemThemeInfo = () => {
  const currentTheme = Appearance.getColorScheme();

  return {
    currentTheme: currentTheme || 'light',
    isSupported: currentTheme !== null,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light' || currentTheme === null,
  };
};

/**
 * Logs current system theme to console (for debugging)
 */
export const logSystemTheme = () => {
  const info = getSystemThemeInfo();
  console.log('📱 System Theme Info:', info);
  return info;
};
