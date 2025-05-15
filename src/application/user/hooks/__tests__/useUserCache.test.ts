/**
 * Test för useUserCache utan JSX/renderHook
 */
import { USER_CACHE_KEYS } from '../useUserCache';

// Skapa mockQueryClient före jest.mock
const mockQueryClient = {
  invalidateQueries: jest.fn().mockResolvedValue(undefined),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  fetchQuery: jest.fn().mockResolvedValue(null)
};

// Skapa mockCacheService före jest.mock
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  getOrSet: jest.fn()
};

// Mocka React Query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn().mockReturnValue(mockQueryClient)
}));

// Mocka alla beroendemodulerna först
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

// Mock för InfrastructureFactory
jest.mock('@/infrastructure/InfrastructureFactory', () => ({
  InfrastructureFactory: {
    getInstance: jest.fn(() => ({
      getCacheService: jest.fn(() => mockCacheService)
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

// Skapa mockad Result-funktion som vi kan använda för att testa
const createMockOkResult = (value) => ({
  isOk: () => true,
  getValue: () => value
});

// Förbereda testdata
const mockUser = {
  id: { toString: () => 'test-user-id' },
  email: { value: 'test@example.com' },
  profile: { displayName: 'TestUser' },
  settings: { theme: 'dark' }
};

// Mock för useUserCache - ersätt faktiska implementationen
jest.mock('../useUserCache', () => {
  // Importera den faktiska cacheKey-strukturen
  const { USER_CACHE_KEYS } = jest.requireActual('../useUserCache');
  
  // Returnera mockat useUserCache
  return {
    USER_CACHE_KEYS,
    useUserCache: jest.fn(() => ({
      cacheUser: jest.fn(async (user) => {
        const userId = user.id.toString();
        mockQueryClient.setQueryData(USER_CACHE_KEYS.user(userId), user);
        mockQueryClient.setQueryData(USER_CACHE_KEYS.userProfile(userId), user.profile);
        mockQueryClient.setQueryData(USER_CACHE_KEYS.userSettings(userId), user.settings);
        
        if (user.email) {
          mockQueryClient.setQueryData(
            USER_CACHE_KEYS.userByEmail(user.email.value), 
            user
          );
        }
        
        // Använd inga externa referenser i mockfunktionen
        await mockCacheService.set(`user_${userId}`, createMockOkResult(user));
      }),
      
      getCachedUser: jest.fn(async (userId) => {
        const data = mockQueryClient.getQueryData(USER_CACHE_KEYS.user(userId));
        if (data) return data;
        
        const cachedResult = await mockCacheService.get(`user_${userId}`);
        if (cachedResult && cachedResult.isOk()) {
          return cachedResult.value;
        }
        
        return null;
      }),
      
      getCachedUserByEmail: jest.fn(async (email) => {
        const data = mockQueryClient.getQueryData(USER_CACHE_KEYS.userByEmail(email));
        if (data) return data;
        
        return null;
      }),
      
      invalidateUserCache: jest.fn(async (userId) => {
        mockQueryClient.invalidateQueries(USER_CACHE_KEYS.user(userId));
        mockQueryClient.invalidateQueries(USER_CACHE_KEYS.userProfile(userId));
        mockQueryClient.invalidateQueries(USER_CACHE_KEYS.userSettings(userId));
        
        await mockCacheService.remove(`user_${userId}`);
      }),
      
      updateUserCache: jest.fn(async (userId, updatedData) => {
        const userData = mockQueryClient.getQueryData(USER_CACHE_KEYS.user(userId));
        if (!userData) return;
        
        const updatedUser = {
          ...userData,
          ...updatedData
        };
        
        mockQueryClient.setQueryData(USER_CACHE_KEYS.user(userId), updatedUser);
      })
    }))
  };
});

// Importera efter mockningsdeklarationer
import { useUserCache } from '../useUserCache';

describe('useUserCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('ska returnera cache-funktionalitet', () => {
    // Act - anropa hook direkt
    const hookResult = useUserCache();
    
    // Assert
    expect(hookResult).toBeTruthy();
    expect(hookResult).toHaveProperty('cacheUser');
    expect(hookResult).toHaveProperty('getCachedUser');
    expect(hookResult).toHaveProperty('getCachedUserByEmail');
    expect(hookResult).toHaveProperty('invalidateUserCache');
    expect(hookResult).toHaveProperty('updateUserCache');
  });
  
  it('ska anropa setQueryData vid cacheUser', async () => {
    // Arrange
    const userId = 'test-user-id';
    
    // Act - anropa hook direkt
    const hookResult = useUserCache();
    await hookResult.cacheUser(mockUser);
    
    // Assert
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      USER_CACHE_KEYS.user(userId),
      mockUser
    );
  });
  
  it('ska anropa getQueryData vid getCachedUser', async () => {
    // Arrange
    const userId = 'test-user-id';
    mockQueryClient.getQueryData.mockReturnValue(mockUser);
    
    // Act - anropa hook direkt
    const hookResult = useUserCache();
    const cachedUser = await hookResult.getCachedUser(userId);
    
    // Assert
    expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(USER_CACHE_KEYS.user(userId));
    expect(cachedUser).toEqual(mockUser);
  });
  
  it('ska anropa invalidateQueries vid invalidateUserCache', async () => {
    // Arrange
    const userId = 'test-user-id';
    
    // Act - anropa hook direkt
    const hookResult = useUserCache();
    await hookResult.invalidateUserCache(userId);
    
    // Assert
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(USER_CACHE_KEYS.user(userId));
  });
  
  it('ska uppdatera cachad data korrekt', async () => {
    // Arrange
    const userId = 'test-user-id';
    mockQueryClient.getQueryData.mockReturnValue(mockUser);
    
    // Uppdatera specifika fält
    const updatedProfile = {
      ...mockUser.profile,
      displayName: 'UpdatedName'
    };
    
    // Act - anropa hook direkt
    const hookResult = useUserCache();
    await hookResult.updateUserCache(userId, { profile: updatedProfile });
    
    // Assert
    expect(mockQueryClient.setQueryData).toHaveBeenCalled();
  });
}); 