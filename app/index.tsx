import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <StatusBar style="auto" />
      <Text className="mb-4 text-2xl font-bold text-blue-600">Welcome to Expo + Tailwind!</Text>
      <TouchableOpacity
        className="rounded-lg bg-blue-500 px-6 py-3"
        onPress={() => alert('Hello!')}>
        <Text className="font-semibold text-white">Press Me</Text>
      </TouchableOpacity>
    </View>
  );
}
