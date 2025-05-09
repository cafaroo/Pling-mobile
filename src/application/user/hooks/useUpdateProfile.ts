import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/infrastructure/supabase/hooks/useSupabase';
import { EventBus } from '@/shared/core/EventBus';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { updateProfile, UpdateProfileInput } from '../useCases/updateProfile';
import { toast } from 'react-native-toast-message';
import { useUserCache, USER_CACHE_KEYS } from './useUserCache';
import { useOptimizedUserDependencies } from './useOptimizedUserDependencies';

/**
 * Hook för att uppdatera användarprofil med optimistisk uppdatering och cachningsstöd
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { supabase } = useSupabase();
  const eventBus = new EventBus();
  const { userRepository: optimizedUserRepo } = useOptimizedUserDependencies();
  const { invalidateUserCache, getCachedUser, updateUserCache } = useUserCache();
  
  const userRepo = new SupabaseUserRepository(supabase, eventBus);

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      // Försök använda det optimerade repository först
      try {
        const result = await updateProfile({ userRepo: optimizedUserRepo })(input);
        if (result.isErr()) {
          throw new Error(result.error);
        }
        return result.value;
      } catch (optimizedError) {
        console.warn('Fel vid användning av optimerat repository, försöker med standard:', optimizedError);
        
        // Fallback till standard repository
        const result = await updateProfile({ userRepo })(input);
        if (result.isErr()) {
          throw new Error(result.error);
        }
        return result.value;
      }
    },
    
    // Optimistisk uppdatering: Vi uppdaterar cachen innan servern svarar
    onMutate: async (variables) => {
      // Avbryt pågående förfrågningar
      await queryClient.cancelQueries(USER_CACHE_KEYS.user(variables.userId));
      
      // Spara nuvarande tillstånd
      const previousUser = await getCachedUser(variables.userId);
      
      // Optimistiskt uppdatera cachen
      if (previousUser) {
        const optimisticUser = {
          ...previousUser,
          profile: {
            ...previousUser.profile,
            ...variables.patch
          }
        };
        
        // Uppdatera i React Query cache
        queryClient.setQueryData(USER_CACHE_KEYS.user(variables.userId), optimisticUser);
        
        // Uppdatera i CacheService
        await updateUserCache(variables.userId, optimisticUser);
        
        console.log('Utfört optimistisk uppdatering av användarprofil');
      }
      
      return { previousUser };
    },
    
    // Vid framgång: Uppdatera all relaterad data
    onSuccess: async (_data, variables) => {
      // Invalidera cachen för att säkerställa senaste data
      await invalidateUserCache(variables.userId);
      
      if (toast && typeof toast.show === 'function') {
        toast.show({
          type: 'success',
          text1: 'Profil uppdaterad',
          text2: 'Dina ändringar har sparats',
        });
      }
    },
    
    // Vid fel: Återställ till tidigare tillstånd
    onError: async (error: Error, variables, context) => {
      console.error('Fel vid uppdatering av profil:', error);
      
      if (context?.previousUser) {
        // Återställ tidigare data i cachen
        queryClient.setQueryData(USER_CACHE_KEYS.user(variables.userId), context.previousUser);
        await updateUserCache(variables.userId, context.previousUser);
      }
      
      if (toast && typeof toast.show === 'function') {
        toast.show({
          type: 'error',
          text1: 'Kunde inte uppdatera profil',
          text2: error.message || 'Ett fel uppstod när profilen skulle uppdateras',
        });
      }
    },
    
    // Oavsett resultat: Säkerställ att data är uppdaterad
    onSettled: async (_data, _error, variables) => {
      // Slutlig invalidering för att garantera korrekt data
      queryClient.invalidateQueries(USER_CACHE_KEYS.user(variables.userId));
    },
  });
}; 