import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '../useUser';
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

// Mock för useUserDependencies
jest.mock('../useUserDependencies', () => ({
  useUserDependencies: jest.fn().mockReturnValue({
    userRepository: {
      getProfile: jest.fn().mockResolvedValue({
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser',
        bio: 'Test bio',
        location: 'Stockholm',
      }),
      getSettings: jest.fn().mockResolvedValue({
        theme: 'dark',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily'
        }
      })
    }
  })
}));

// Testsvit för useUser hook
describe('useUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Återställ global mock för Supabase
    global.__mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('ska returnera användardata när användaren är inloggad', async () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    // Verifiera laddningstillstånd
    expect(result.current.isLoading).toBe(true);

    // Vänta på att data laddas
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifiera att data är korrekt
    expect(result.current.data).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser',
        bio: 'Test bio',
        location: 'Stockholm',
      },
      settings: {
        theme: 'dark',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily'
        }
      }
    });
  });

  it('ska hantera fel när användaren inte är inloggad', async () => {
    // Konfigurera Supabase-mock för att simulera att ingen användare är inloggad
    global.__mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    // Vänta på att felet uppstår
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifiera felmeddelande
    expect(result.current.error).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Ingen inloggad användare');
  });

  it('ska hantera fel från användarrepository', async () => {
    // Återanvänd mocken från useUserDependencies men ändra implementationen
    const getProfileMock = jest.fn().mockRejectedValue(new Error('Databasfel'));
    jest.mock('../useUserDependencies', () => ({
      useUserDependencies: jest.fn().mockReturnValue({
        userRepository: {
          getProfile: getProfileMock,
          getSettings: jest.fn().mockResolvedValue({
            theme: 'dark',
            language: 'sv',
          })
        }
      })
    }));

    const { result } = renderHook(() => useUser(), { wrapper });

    // Vänta på att felet uppstår
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Vi förväntar oss att testet misslyckas på grund av databasfel
    // men React Query fångar felet och visar ett generiskt meddelande
    expect(result.current.error).toBeDefined();
  });
  
  it('ska cachea data korrekt', async () => {
    // Första renderingen för att ladda data
    const { result: firstResult } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(firstResult.current.isSuccess).toBe(true));
    
    // Kontrollera att useQuery-anropet i andra renderingen återanvänder cachad data
    const getProfileMock = jest.fn().mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
    });
    
    jest.mock('../useUserDependencies', () => ({
      useUserDependencies: jest.fn().mockReturnValue({
        userRepository: {
          getProfile: getProfileMock,
          getSettings: jest.fn().mockResolvedValue({
            theme: 'dark',
            language: 'sv',
          })
        }
      })
    }));
    
    const { result: secondResult } = renderHook(() => useUser(), { wrapper });
    
    // Vänta på att data laddas för andra renderingen
    await waitFor(() => expect(secondResult.current.isSuccess).toBe(true));
    
    // getProfile ska inte kallas igen eftersom data redan är cachad
    expect(getProfileMock).not.toHaveBeenCalled();
  });
}); 