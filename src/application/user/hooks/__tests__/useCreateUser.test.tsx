import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateUser } from '../useCreateUser';
import { createUser } from '../../useCases/createUser';
import { Result, ok, err } from '@/shared/core/Result';
import React from 'react';

// Mocka dependencies som normalt skulle mockats i setup-apptest.js
jest.mock('@/infrastructure/supabase/index', () => ({
  supabase: global.__mockSupabase
}));

jest.mock('@/shared/domain/UniqueId', () => ({
  UniqueId: jest.fn().mockImplementation(global.__mockUniqueId)
}));

jest.mock('@/shared/events/EventBus', () => ({
  EventBus: jest.fn().mockImplementation(() => global.__mockEventBus),
  useEventBus: jest.fn().mockReturnValue(global.__mockEventBus)
}));

// Mock createUser användarfall
jest.mock('../../useCases/createUser');
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

// Testsvit för useCreateUser hook
describe('useCreateUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const validInput = {
    email: 'test@example.com',
    name: 'Test User',
    phone: '+46701234567',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily'
      }
    }
  };

  it('ska skapa en användare framgångsrikt', async () => {
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(ok(undefined));
    mockCreateUser.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useCreateUser(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockUseCaseImplementation).toHaveBeenCalledWith(validInput);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('ska hantera valideringsfel', async () => {
    const errorMessage = 'Ogiltig e-postadress';
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(err(errorMessage));
    mockCreateUser.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useCreateUser(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          ...validInput,
          email: 'invalid-email'
        });
      } catch (error) {
        // Förväntat fel
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(errorMessage);
  });

  it('ska uppdatera cache efter framgångsrik skapande', async () => {
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(ok(undefined));
    mockCreateUser.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useCreateUser(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    // Verifiera att queryClient har invaliderat relevanta queries
    const queryCache = queryClient.getQueryCache();
    const cachedQueries = queryCache.getAll();
    
    expect(cachedQueries.some(query => 
      query.queryKey.includes('users') || 
      query.queryKey.includes('user')
    )).toBe(false);
  });

  it('ska hantera nätverksfel', async () => {
    const networkError = new Error('Nätverksfel');
    const mockUseCaseImplementation = jest.fn().mockRejectedValue(networkError);
    mockCreateUser.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useCreateUser(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(validInput);
      } catch (error) {
        // Förväntat fel
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(networkError.message);
  });

  it('ska visa laddningstillstånd under mutation', async () => {
    const mockUseCaseImplementation = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(ok(undefined)), 100))
    );
    mockCreateUser.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useCreateUser(), { wrapper });

    const mutationPromise = act(async () => {
      result.current.mutate(validInput);
    });

    expect(result.current.isLoading).toBe(true);

    await mutationPromise;
    expect(result.current.isLoading).toBe(false);
  });
}); 