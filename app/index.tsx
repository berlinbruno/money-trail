import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';


export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <StatusBar style="auto" />
      <Text className="text-2xl font-bold text-blue-600 mb-4">
        Welcome to Expo + Tailwind!
      </Text>
      <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg" onPress={() => alert('Hello!')}>
        <Text className="text-white font-semibold">Press Me</Text>
      </TouchableOpacity>
    </View>
  );
}