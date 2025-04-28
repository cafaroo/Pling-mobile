import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function TeamLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.dark },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="analytics" />
      <Stack.Screen 
        name="subscription"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}