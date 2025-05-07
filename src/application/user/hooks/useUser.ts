import { useQuery } from '@tanstack/react-query';
import { useUserDependencies } from './useUserDependencies';
import { supabase } from '../../../infrastructure/supabase';

export const useUser = () => {
  const { userRepository } = useUserDependencies();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ingen inloggad användare');

      const [profile, settings] = await Promise.all([
        userRepository.getProfile(user.id),
        userRepository.getSettings(user.id),
      ]);

      return {
        id: user.id,
        email: user.email,
        profile,
        settings,
      };
    },
  });
}; 