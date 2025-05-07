import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/infrastructure/supabase/hooks/useSupabase';
import { EventBus } from '@/shared/core/EventBus';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { updateProfile, UpdateProfileInput } from '../useCases/updateProfile';
import { toast } from 'react-native-toast-message';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const eventBus = new EventBus();
  
  const userRepo = new SupabaseUserRepository(supabase, eventBus);

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const result = await updateProfile({ userRepo })(input);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }

      return result.value;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['user', variables.userId]);
      queryClient.invalidateQueries(['users']);
      toast.show({
        type: 'success',
        text1: 'Profil uppdaterad',
        text2: 'Dina ändringar har sparats',
      });
    },
    onError: (error: Error) => {
      toast.show({
        type: 'error',
        text1: 'Kunde inte uppdatera profil',
        text2: error.message || 'Ett fel uppstod när profilen skulle uppdateras',
      });
    },
  });
}; 