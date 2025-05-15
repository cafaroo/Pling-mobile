import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLoadedAssets } from '@/hooks/useLoadedAssets';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ResourceLimitProvider } from '@/components/subscription/ResourceLimitProvider';
import { NotificationListener } from '@/components/notifications';
import { OrganizationProvider } from '@/components/organization/OrganizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DomainProvidersComposer } from '@/application/providers/DomainProvidersComposer';
import { supabase } from '@/lib/supabase';

// Förhindra att splash screen döljs automatiskt
SplashScreen.preventAutoHideAsync();

// Skapa en QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuter
      cacheTime: 10 * 60 * 1000, // 10 minuter
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const assetsLoaded = useLoadedAssets();

  useEffect(() => {
    if (assetsLoaded) {
      // Dölj splash screen när tillgångar har laddats
      SplashScreen.hideAsync();
    }
  }, [assetsLoaded]);

  if (!assetsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <DomainProvidersComposer supabaseClient={supabase}>
                <OrganizationProvider
                  onOrganizationChange={(orgId) => setCurrentOrganizationId(orgId)}
                >
                  {currentOrganizationId && (
                    <ResourceLimitProvider organizationId={currentOrganizationId}>
                      <NotificationListener />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      />
                    </ResourceLimitProvider>
                  )}
                  {!currentOrganizationId && (
                    <Stack
                      screenOptions={{
                        headerShown: false,
                      }}
                    />
                  )}
                </OrganizationProvider>
              </DomainProvidersComposer>
            </AuthProvider>
          </QueryClientProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
} 