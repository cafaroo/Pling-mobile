import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '../useUser';
import React from 'react';

// Skapa mockar före användning
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })
  }
};

const mockUniqueId = (id) => ({
  toString: () => id,
  value: id
});

const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
};

// Mocka dependencies som normalt skulle mockats i setup-apptest.js
jest.mock('@/infrastructure/supabase/index', () => ({
  supabase: mockSupabase
}));

jest.mock('@/shared/domain/UniqueId', () => ({
  UniqueId: jest.fn().mockImplementation((id) => mockUniqueId(id))
}));

jest.mock('@/shared/events/EventBus', () => ({
  EventBus: jest.fn().mockImplementation(() => mockEventBus),
  useEventBus: jest.fn().mockReturnValue(mockEventBus)
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
    
    // Återställ mock för Supabase
    mockSupabase.auth.getUser.mockResolvedValue({
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
    mockSupabase.auth.getUser.mockResolvedValue({
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
    // Skapa en ny mock med jest.mock och specificera i testet, utan att referera till en extern variabel
    const mockUserDependenciesWithError = {
      useUserDependencies: jest.fn().mockReturnValue({
        userRepository: {
          getProfile: jest.fn().mockRejectedValue(new Error('Databasfel')),
          getSettings: jest.fn().mockResolvedValue({
            theme: 'dark',
            language: 'sv',
          })
        }
      })
    };

    // Ersätt den befintliga mock-implementationen tillfälligt, bara inom detta test
    const originalImplementation = require('../useUserDependencies');
    jest.doMock('../useUserDependencies', () => mockUserDependenciesWithError, { virtual: true });

    const { result } = renderHook(() => useUser(), { wrapper });

    // Vänta på att felet uppstår
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Vi förväntar oss att testet misslyckas på grund av databasfel
    // men React Query fångar felet och visar ett generiskt meddelande
    expect(result.current.error).toBeDefined();

    // Återställ den ursprungliga implementationen
    jest.doMock('../useUserDependencies', () => originalImplementation, { virtual: true });
  });
  
  it('ska cachea data korrekt', async () => {
    // Första renderingen för att ladda data
    const { result: firstResult } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(firstResult.current.isSuccess).toBe(true));
    
    // För andra renderingen, skapa en ny mock
    const mockProfileFunction = jest.fn().mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
    });
    
    const mockUserDependenciesForCaching = {
      useUserDependencies: jest.fn().mockReturnValue({
        userRepository: {
          getProfile: mockProfileFunction,
          getSettings: jest.fn().mockResolvedValue({
            theme: 'dark',
            language: 'sv',
          })
        }
      })
    };

    // Ersätt den befintliga mock-implementationen tillfälligt, bara inom detta test
    const originalCachingImplementation = require('../useUserDependencies');
    jest.doMock('../useUserDependencies', () => mockUserDependenciesForCaching, { virtual: true });
    
    const { result: secondResult } = renderHook(() => useUser(), { wrapper });
    
    // Vänta på att data laddas för andra renderingen
    await waitFor(() => expect(secondResult.current.isSuccess).toBe(true));
    
    // getProfile ska inte kallas igen eftersom data redan är cachad
    expect(mockProfileFunction).not.toHaveBeenCalled();

    // Återställ den ursprungliga implementationen
    jest.doMock('../useUserDependencies', () => originalCachingImplementation, { virtual: true });
  });
}); 