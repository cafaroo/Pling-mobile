import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateUser } from '../useCreateUser';
import { createUser } from '../../useCases/createUser';
import React from 'react';

// Definiera globala mockar
const mockEventBusImpl = {
  publish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockImplementation(() => ({ unsubscribe: jest.fn() })),
  unsubscribe: jest.fn(),
  clear: jest.fn(),
  getSubscribers: jest.fn().mockReturnValue([]),
  hasSubscribers: jest.fn().mockReturnValue(false)
};

const mockResultImpl = {
  ok: jest.fn().mockImplementation(value => ({
    isSuccess: true,
    _value: value,
    getValue: () => value,
    isErr: () => false,
    isOk: () => true,
    error: null,
    unwrap: () => value
  })),
  
  err: jest.fn().mockImplementation(error => ({
    isSuccess: false,
    _error: error,
    getValue: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    isErr: () => true,
    isOk: () => false,
    error,
    unwrap: () => { throw new Error(typeof error === 'string' ? error : 'Error'); }
  }))
};

const mockSupabaseClientImpl = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    data: null,
    error: null,
    then: jest.fn(cb => Promise.resolve(cb({ data: [], error: null })))
  }),
  auth: {
    signUp: jest.fn().mockResolvedValue({ user: null, session: null, error: null }),
    signIn: jest.fn().mockResolvedValue({ user: null, session: null, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  }
};

// Mocka alla beroenden
jest.mock('@/infrastructure/supabase/hooks/useSupabase', () => ({
  useSupabase: jest.fn().mockReturnValue(mockSupabaseClientImpl)
}));

jest.mock('@/shared/core/UniqueId', () => ({
  UniqueId: jest.fn().mockImplementation((id) => ({
    toString: () => id || 'mocked-unique-id',
    equals: (other) => id === other?.toString(),
  }))
}));

jest.mock('@/shared/core/EventBus', () => ({
  EventBus: jest.fn().mockImplementation(() => mockEventBusImpl),
  useEventBus: jest.fn().mockReturnValue(mockEventBusImpl),
  getEventBus: jest.fn().mockReturnValue(mockEventBusImpl)
}));

jest.mock('@/shared/core/Result', () => ({
  Result: mockResultImpl,
  ok: jest.fn().mockImplementation(val => mockResultImpl.ok(val)),
  err: jest.fn().mockImplementation(err => mockResultImpl.err(err))
}));

// Mocka createUser-funktionen
jest.mock('../../useCases/createUser', () => ({
  createUser: jest.fn().mockImplementation(() => {
    return jest.fn().mockResolvedValue(mockResultImpl.ok(undefined));
  })
}));

describe('useCreateUser Hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('ska returnera mutation med rätt egenskaper', () => {
    const { result } = renderHook(() => useCreateUser(), { wrapper });
    
    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('error');
  });

  // Öka timeout för att undvika timeout-problem
  it('ska anropa createUser när mutation används', async () => {
    const { result } = renderHook(() => useCreateUser(), { wrapper });
    
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser',
        bio: 'Test bio',
        contact: {
          email: 'test@example.com',
          phone: '+46701234567',
          alternativeEmail: null
        }
      },
      settings: { 
        theme: 'light',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily'
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: true,
          showPhone: true
        }
      }
    };
    
    await act(async () => {
      await result.current.mutateAsync(userData);
    });
    
    expect(createUser).toHaveBeenCalled();
  }, 10000);
}); 