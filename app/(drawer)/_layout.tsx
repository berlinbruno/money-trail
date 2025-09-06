import { Drawer } from 'expo-router/drawer';
import { Bell, CheckCheck, Home, Settings } from 'lucide-react-native';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: '#007aff',
        drawerLabelStyle: { fontSize: 16 },
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerLabel: 'Dashboard',
          title: 'MoneyTrail',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="approveTransaction"
        options={{
          drawerLabel: 'Approve Transactions',
          title: 'Transaction Approval',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <CheckCheck color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="alerts"
        options={{
          drawerLabel: 'Manage Alerts',
          title: 'Alerts',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Bell color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
