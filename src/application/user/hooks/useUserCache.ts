import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/domain/user/entities/User';
import { CacheService } from '@/infrastructure/cache/CacheService';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { getEventBus } from '@/shared/core/EventBus';
import { supabase } from '@/infrastructure/supabase';
import { Result } from '@/shared/core/Result';

/**
 * Nyckelstruktur för användarrelaterade cacheningar
 */
export const USER_CACHE_KEYS = {
  user: (userId: string) => ['user', userId],
  userProfile: (userId: string) => ['user', userId, 'profile'],
  userSettings: (userId: string) => ['user', userId, 'settings'],
  userByEmail: (email: string) => ['user', 'email', email],
  allUsers: ['users'],
  usersByTeam: (teamId: string) => ['users', 'team', teamId],
};

/**
 * Hook för att hantera cachning av användardata med både React Query och CacheService
 */
export const useUserCache = () => {
  const queryClient = useQueryClient();
  
  // Hämta cachning-tjänst från infrastruktur-factory
  const infrastructureFactory = InfrastructureFactory.getInstance(
    supabase,
    getEventBus(),
    {
      cacheTtl: 15 * 60 * 1000, // 15 minuter cache
      cacheVersion: '1.1',
      enableCacheDebug: false
    }
  );
  
  const cacheService = infrastructureFactory.getCacheService('users');
  
  /**
   * Cacha användardata i både React Query och den generella CacheService
   */
  const cacheUser = async (user: User, ttlOverride?: number) => {
    if (!user || !user.id) return;
    
    const userId = user.id.toString();
    
    // Cacha i React Query
    queryClient.setQueryData(USER_CACHE_KEYS.user(userId), user);
    
    // Cacha användarens profil och inställningar separat för finkornig cachning
    queryClient.setQueryData(USER_CACHE_KEYS.userProfile(userId), user.profile);
    queryClient.setQueryData(USER_CACHE_KEYS.userSettings(userId), user.settings);
    
    if (user.email) {
      queryClient.setQueryData(
        USER_CACHE_KEYS.userByEmail(user.email.value), 
        user
      );
    }
    
    // Cacha i CacheService för längre persistens och delning mellan hooks
    await cacheService.set(`user_${userId}`, Result.ok(user));
    
    if (user.email) {
      await cacheService.set(`user_email_${user.email.value}`, Result.ok(user));
    }
  };
  
  /**
   * Hämta cachad användardata med fallback till CacheService
   */
  const getCachedUser = async (userId: string): Promise<User | null> => {
    // Försök få från React Query först (snabbast)
    const queryData = queryClient.getQueryData<User>(USER_CACHE_KEYS.user(userId));
    if (queryData) return queryData;
    
    // Annars försök från CacheService
    try {
      const cachedResult = await cacheService.get<Result<User, string>>(`user_${userId}`);
      if (cachedResult && cachedResult.isOk()) {
        const user = cachedResult.value;
        
        // Synkronisera med React Query för kommande accesser
        queryClient.setQueryData(USER_CACHE_KEYS.user(userId), user);
        
        return user;
      }
    } catch (error) {
      console.error('Fel vid hämtning från cache:', error);
    }
    
    return null;
  };
  
  /**
   * Hämta användardata via e-post med cachning
   */
  const getCachedUserByEmail = async (email: string): Promise<User | null> => {
    // Försök få från React Query först
    const queryData = queryClient.getQueryData<User>(USER_CACHE_KEYS.userByEmail(email));
    if (queryData) return queryData;
    
    // Annars försök från CacheService
    try {
      const cachedResult = await cacheService.get<Result<User, string>>(`user_email_${email}`);
      if (cachedResult && cachedResult.isOk()) {
        const user = cachedResult.value;
        
        // Synkronisera med React Query för kommande accesser
        queryClient.setQueryData(USER_CACHE_KEYS.userByEmail(email), user);
        queryClient.setQueryData(USER_CACHE_KEYS.user(user.id.toString()), user);
        
        return user;
      }
    } catch (error) {
      console.error('Fel vid hämtning från cache via email:', error);
    }
    
    return null;
  };
  
  /**
   * Invalidera cachning för en användare
   */
  const invalidateUserCache = async (userId: string) => {
    // Hämta användardata för att kunna invalidera sekundära nycklar
    const userData = await getCachedUser(userId);
    
    // Invalidera React Query cache
    queryClient.invalidateQueries(USER_CACHE_KEYS.user(userId));
    queryClient.invalidateQueries(USER_CACHE_KEYS.userProfile(userId));
    queryClient.invalidateQueries(USER_CACHE_KEYS.userSettings(userId));
    
    if (userData?.email) {
      queryClient.invalidateQueries(
        USER_CACHE_KEYS.userByEmail(userData.email.value)
      );
    }
    
    // Rensa CacheService
    await cacheService.remove(`user_${userId}`);
    
    if (userData?.email) {
      await cacheService.remove(`user_email_${userData.email.value}`);
    }
    
    // Invalidera teamcachning
    if (userData?.teamIds) {
      for (const teamId of userData.teamIds) {
        queryClient.invalidateQueries(
          USER_CACHE_KEYS.usersByTeam(teamId.toString())
        );
        await cacheService.remove(`user_team_${teamId.toString()}`);
      }
    }
  };
  
  /**
   * Uppdatera cachning för en användare
   */
  const updateUserCache = async (userId: string, updatedData: Partial<User>) => {
    const userData = await getCachedUser(userId);
    if (!userData) return;
    
    // Skapa uppdaterad användardata
    const updatedUser = {
      ...userData,
      ...updatedData
    };
    
    // Cacha den uppdaterade användaren
    await cacheUser(updatedUser as User);
  };
  
  return {
    cacheUser,
    getCachedUser,
    getCachedUserByEmail,
    invalidateUserCache,
    updateUserCache,
    USER_CACHE_KEYS
  };
}; 