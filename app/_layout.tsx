import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <SQLiteProvider
      databaseName="app.db"
      assetSource={{ assetId: require('@/assets//database/app.db') }}
      onInit={async (db) => {
        await db.execAsync('PRAGMA journal_mode = WAL;');
      }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="backgroundScreen" />
          <Stack.Screen name="debugScreen" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
