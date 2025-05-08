import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../ui/theme';
import { AuthProvider } from '@context/AuthContext';

// Skapa en QueryClient-instans
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minuter
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
} 