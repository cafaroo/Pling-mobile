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

// Förhindra att splash screen döljs automatiskt
SplashScreen.preventAutoHideAsync();

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
          <AuthProvider>
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
          </AuthProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
} 