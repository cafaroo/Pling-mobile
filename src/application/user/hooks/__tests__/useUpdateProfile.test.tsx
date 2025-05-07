import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from '../useUpdateProfile';
import { updateProfile } from '../../useCases/updateProfile';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import React from 'react';

// Mock updateProfile användarfall
jest.mock('../../useCases/updateProfile');
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

// Testsvit för useUpdateProfile hook
describe('useUpdateProfile', () => {
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
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567'
      }
    }
  };

  it('ska uppdatera profil framgångsrikt', async () => {
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(ok(undefined));
    mockUpdateProfile.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockUseCaseImplementation).toHaveBeenCalledWith(validInput);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('ska hantera valideringsfel', async () => {
    const errorMessage = 'Ogiltigt förnamn';
    const mockUseCaseImplementation = jest.fn().mockResolvedValue(err(errorMessage));
    mockUpdateProfile.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          ...validInput,
          profile: {
            ...validInput.profile,
            firstName: ''
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
    mockUpdateProfile.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

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
    mockUpdateProfile.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

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
    mockUpdateProfile.mockReturnValue(mockUseCaseImplementation);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    const mutationPromise = act(async () => {
      result.current.mutate(validInput);
    });

    expect(result.current.isLoading).toBe(true);

    await mutationPromise;
    expect(result.current.isLoading).toBe(false);
  });
}); 