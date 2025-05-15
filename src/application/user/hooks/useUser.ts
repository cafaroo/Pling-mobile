import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserDependencies } from './useUserDependencies';
import { supabase } from '../../../infrastructure/supabase';
import { useUserCache, USER_CACHE_KEYS } from './useUserCache';
import { useOptimizedUserDependencies } from './useOptimizedUserDependencies';

/**
 * Hook för att hämta användardata med optimerad cachning
 * Använder både React Query och den underliggande CacheService för maximal prestanda
 */
export const useUser = (userId?: string) => {
  const { userRepository } = useUserDependencies();
  const { userRepository: optimizedUserRepository } = useOptimizedUserDependencies();
  const { getCachedUser, cacheUser, invalidateUserCache } = useUserCache();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userId ? USER_CACHE_KEYS.user(userId) : ['user', 'current'],
    queryFn: async () => {
      // Få ID för nuvarande eller angiven användare
      let currentUserId = userId;
      
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Ingen inloggad användare');
        currentUserId = user.id;
      }
      
      // Försök hämta från cache först
      const cachedUser = await getCachedUser(currentUserId);
      if (cachedUser) {
        console.log('Använder cachad användardata');
        return cachedUser;
      }
      
      // Om inte cachad, hämta från optimerat repository
      console.log('Hämtar användardata från databas');
      try {
        const userResult = await optimizedUserRepository.findById(currentUserId);
        
        if (userResult.isErr()) {
          throw new Error(userResult.error);
        }
        
        const user = userResult.value;
        
        // Cacha för framtida användning
        await cacheUser(user);
        
        return user;
      } catch (optimizedError) {
        console.warn('Fel vid hämtning från optimerat repository, provar standard:', optimizedError);
        
        // Fallback till standard repository om optimerat misslyckas
        const [profile, settings] = await Promise.all([
          userRepository.getProfile(currentUserId),
          userRepository.getSettings(currentUserId),
        ]);
        
        return {
          id: currentUserId,
          email: profile.email,
          profile,
          settings,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minuter innan data anses vara föråldrad
    cacheTime: 30 * 60 * 1000, // 30 minuter cachning i React Query
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    onError: (error) => {
      console.error('Fel vid hämtning av användare:', error);
    }
  });
}; 