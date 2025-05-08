import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
        staleTime: Infinity,
        gcTime: Infinity,
        throwOnError: true
      }
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    }
  });

export const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Öka timeout för waitFor
export const WAIT_FOR_OPTIONS = {
  timeout: 5000,
  interval: 50
}; 