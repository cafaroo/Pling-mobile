import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserCache, USER_CACHE_KEYS } from '../useUserCache';

// Mock för alla beroendemodulerna
jest.mock('@/domain/user/entities/User', () => ({
  User: {
    create: jest.fn()
  }
}));

jest.mock('@/shared/core/UniqueId', () => ({
  UniqueId: jest.fn()
}));

jest.mock('@/domain/user/value-objects/Email', () => ({
  Email: {
    create: jest.fn()
  }
}));

jest.mock('@/domain/user/value-objects/PhoneNumber', () => ({
  PhoneNumber: {
    create: jest.fn()
  }
}));

jest.mock('@/domain/user/entities/UserProfile', () => ({
  UserProfile: {
    create: jest.fn()
  }
}));

jest.mock('@/domain/user/entities/UserSettings', () => ({
  UserSettings: {
    create: jest.fn()
  }
}));

// Mock för Result
jest.mock('@/shared/core/Result', () => ({
  Result: {
    ok: jest.fn(val => ({ isSuccess: true, _value: val, getValue: () => val })),
    err: jest.fn(err => ({ isSuccess: false, _error: err, getValue: () => { throw new Error('Error'); } }))
  }
}));

// Mock för InfrastructureFactory
jest.mock('@/infrastructure/InfrastructureFactory', () => ({
  InfrastructureFactory: {
    getInstance: jest.fn(() => ({
      getCacheService: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        getOrSet: jest.fn()
      }))
    }))
  }
}));

// Mock för att undvika faktiska API-anrop
jest.mock('@/infrastructure/supabase', () => ({
  supabase: {}
}));

// Mock för getEventBus
jest.mock('@/shared/core/EventBus', () => ({
  getEventBus: jest.fn(() => ({
    publish: jest.fn(),
    subscribe: jest.fn()
  }))
}));

// Förbereda testdata
const mockUser = {
  id: { toString: () => 'test-user-id' },
  email: { value: 'test@example.com' },
  profile: { displayName: 'TestUser' },
  settings: { theme: 'dark' }
};

describe('useUserCache', () => {
  let queryClient: QueryClient;
  let hookResult: any = null;
  
  // Skapa en hook-komponent för testerna
  const TestComponent = () => {
    hookResult = useUserCache();
    return null;
  };
  
  beforeEach(() => {
    // Skapa en ny QueryClient för varje test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: Infinity,
        },
      },
    });
    
    // Rendera komponenten med React Query-providern
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestComponent)
      )
    );
    
    jest.clearAllMocks();
  });
  
  it('ska returnera cache-funktionalitet', () => {
    expect(hookResult).toBeTruthy();
    expect(hookResult).toHaveProperty('cacheUser');
    expect(hookResult).toHaveProperty('getCachedUser');
    expect(hookResult).toHaveProperty('getCachedUserByEmail');
    expect(hookResult).toHaveProperty('invalidateUserCache');
    expect(hookResult).toHaveProperty('updateUserCache');
  });
  
  it('ska cacha användardata i queryClient', async () => {
    await hookResult.cacheUser(mockUser);
    
    const userId = 'test-user-id';
    
    // Kontrollera att useQuery-cachen har uppdaterats
    const cachedData = queryClient.getQueryData(USER_CACHE_KEYS.user(userId));
    expect(cachedData).toEqual(mockUser);
  });
  
  it('ska hämta cachad data från queryClient', async () => {
    const userId = 'test-user-id';
    
    // Cacha först användardata
    queryClient.setQueryData(USER_CACHE_KEYS.user(userId), mockUser);
    
    // Hämta från cache
    const cachedUser = await hookResult.getCachedUser(userId);
    expect(cachedUser).toEqual(mockUser);
  });
  
  it('ska invalidera cachen korrekt', async () => {
    const userId = 'test-user-id';
    
    // Cacha först användardata
    queryClient.setQueryData(USER_CACHE_KEYS.user(userId), mockUser);
    queryClient.setQueryData(USER_CACHE_KEYS.userProfile(userId), mockUser.profile);
    queryClient.setQueryData(USER_CACHE_KEYS.userSettings(userId), mockUser.settings);
    
    // Spionera på invalidateQueries för att verifiera att den anropas
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    
    // Invalidera cachen
    await hookResult.invalidateUserCache(userId);
    
    // Verifiera att invalidateQueries anropades med rätt parametrar
    expect(invalidateSpy).toHaveBeenCalledWith(USER_CACHE_KEYS.user(userId));
    expect(invalidateSpy).toHaveBeenCalledWith(USER_CACHE_KEYS.userProfile(userId));
    expect(invalidateSpy).toHaveBeenCalledWith(USER_CACHE_KEYS.userSettings(userId));
    
    // Återställ spy
    invalidateSpy.mockRestore();
  });
  
  it('ska uppdatera cachad data', async () => {
    const userId = 'test-user-id';
    
    // Cacha först användardata
    queryClient.setQueryData(USER_CACHE_KEYS.user(userId), mockUser);
    
    // Uppdatera specifika fält
    const updatedProfile = {
      ...mockUser.profile,
      displayName: 'UpdatedName'
    };
    
    await hookResult.updateUserCache(userId, { profile: updatedProfile });
    
    // Hämta uppdaterad cache
    const updatedUser = queryClient.getQueryData(USER_CACHE_KEYS.user(userId));
    expect(updatedUser).toHaveProperty('profile.displayName', 'UpdatedName');
  });
}); 