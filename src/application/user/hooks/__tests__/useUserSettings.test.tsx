import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateSettings } from '../useUpdateSettings';
import { updateSettings } from '../../useCases/updateSettings';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import React from 'react';

// Mock updateSettings användarfall
jest.mock('../../useCases/updateSettings');
const mockUpdateSettings = updateSettings as jest.MockedFunction<typeof updateSettings>;

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

// Testsvit för useUpdateSettings hook
describe('useUpdateSettings', () => {
  let queryClient: QueryClient;
  const userId = new UniqueId('test-user-id');

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
    userId: userId.toString(),
    settings: {
      theme: 'dark',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily'
      },
      privacy: {
        profileVisibility: 'friends',
        activityVisibility: 'team'
      }
    }
  };

  it('ska uppdatera inställningar framgångsrikt', async () => {
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(ok(undefined));
    mockUpdateSettings.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockUseCaseImplementation).toHaveBeenCalledWith(validInput);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('ska hantera valideringsfel', async () => {
    const errorMessage = 'Ogiltigt språkval';
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(err(errorMessage));
    mockUpdateSettings.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          ...validInput,
          settings: {
            ...validInput.settings,
            language: ''
          }
        });
      } catch (error) {
        // Förväntat fel
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(errorMessage);
  });

  it('ska uppdatera cache efter framgångsrik uppdatering', async () => {
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(ok(undefined));
    mockUpdateSettings.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    // Verifiera att queryClient har invaliderat relevanta queries
    const queryCache = queryClient.getQueryCache();
    const cachedQueries = queryCache.getAll();
    
    expect(cachedQueries.some(query => 
      query.queryKey.includes('user') && 
      query.queryKey.includes(userId.toString())
    )).toBe(false);
  });

  it('ska hantera nätverksfel', async () => {
    const networkError = new Error('Nätverksfel');
    const mockUseCaseImplementation = jest.fn().mockRejectedValue(networkError);
    mockUpdateSettings.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });

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
    mockUpdateSettings.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });

    const mutationPromise = act(async () => {
      result.current.mutate(validInput);
    });

    expect(result.current.isLoading).toBe(true);

    await mutationPromise;
    expect(result.current.isLoading).toBe(false);
  });
}); 