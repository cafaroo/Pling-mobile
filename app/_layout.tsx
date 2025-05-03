import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Accelerometer } from 'expo-sensors';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Skapa React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const lastShake = useRef(0);
  
  // Ladda fonter med Expo Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  // Dölj splash-skärmen när fonter är laddade
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Använd any för att undvika typfel, subscription har en remove() metod
    let subscription: { remove: () => void } | null = null;
    
    // Kör accelerometer-kod endast på nativa plattformar
    if (Platform.OS !== 'web') {
      const startAccelerometer = async () => {
        const shakeThreshold = 1.8; // Justera känslighet
        const cooldownPeriod = 1000; // Millisekunder mellan skakningar

        await Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          
          if (acceleration > shakeThreshold && (now - lastShake.current) > cooldownPeriod) {
            lastShake.current = now;
            router.push('/pling');
          }
        });
      };
      
      startAccelerometer();
      
      return () => {
        subscription?.remove();
      };
    }
  }, []);

  // Returnera null för att hålla splash-skärmen synlig medan fonter laddas
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: Platform.OS === 'web' ? {
                  pointerEvents: 'auto'
                } : undefined
              }}
            />
            <StatusBar style="light" />
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}