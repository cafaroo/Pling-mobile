import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UITestHelper } from './helpers/UITestHelper';

/**
 * Standardiserad QueryClient för tester
 * 
 * Konfigurerad med optimala inställningar för testmiljö:
 * - Inga retries (för snabbare tester)
 * - Ingen caching (för isolerade tester)
 * - Ingen stale time (för att undvika flaky tester)
 */
export const createTestQueryClient = (): QueryClient => {
  return UITestHelper.createTestQueryClient();
};

// Förkonfigurerade options för waitFor i tester
export const WAIT_FOR_OPTIONS = {
  timeout: 5000,
};

/**
 * QueryClientTestProvider
 * 
 * Wrapper-komponent för att enkelt lägga till React Query-stöd i tester.
 * Använd denna komponent när du behöver testa hooks eller komponenter som använder
 * useQuery, useMutation, eller andra React Query-funktioner.
 * 
 * @example
 * // I ett test
 * render(
 *   <QueryClientTestProvider>
 *     <YourComponent />
 *   </QueryClientTestProvider>
 * );
 * 
 * // Eller med jest.mock för att skapa en wrapper-funktion
 * const wrapper = ({ children }) => (
 *   <QueryClientTestProvider>{children}</QueryClientTestProvider>
 * );
 */
export const QueryClientTestProvider: React.FC<{
  children: React.ReactNode;
  client?: QueryClient;
}> = ({ children, client }) => {
  const queryClient = client || createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Helper-funktion för att skapa en wrapper för tester
 * 
 * @example
 * // I ett test
 * const wrapper = createQueryClientWrapper();
 * render(<YourComponent />, { wrapper });
 */
export const createQueryClientWrapper = (client?: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientTestProvider client={client}>
      {children}
    </QueryClientTestProvider>
  );
}; 