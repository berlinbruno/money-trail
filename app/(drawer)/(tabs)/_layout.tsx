import { DrawerActions, useNavigation, useTheme } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { ArrowUpDown, ChartBar, HomeIcon, Menu } from 'lucide-react-native';
import { Pressable } from 'react-native';

export default function TabLayout() {
  const navigation = useNavigation();
  const theme = useTheme();

  const headerLeft = () => (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={{ paddingLeft: 16 }}>
      <Menu color={theme.colors.text} size={22} style={{ padding: 4 }} />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft,
        tabBarActiveTintColor: theme.colors.text,
        headerTitleAlign: 'left', // or 'left' if preferred
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }: { color: string }) => <ChartBar size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }: { color: string }) => <ArrowUpDown size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
