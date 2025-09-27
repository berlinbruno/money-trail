import { useTheme } from '@/contexts/ThemeContext';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

/**
 * Themed content component that handles navigation and theming
 * Responds to theme context changes and renders the app navigation stack
 */
export function ThemedContent() {
  const { colorScheme, isThemeLoading } = useTheme();

  // Only block rendering during initial theme loading to prevent navigation unmounting
  if (isThemeLoading) {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="background"
          options={{ headerShown: true, title: 'Background Tasks' }}
        />
        <Stack.Screen name="debug" options={{ headerShown: true, title: 'Debug' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
