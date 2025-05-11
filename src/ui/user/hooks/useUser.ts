import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@hooks/useSupabase';
import { UserRepository } from '@services/UserRepository';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  settings?: {
    name?: string;
    bio?: string;
    location?: string;
    contact?: {
      phone?: string;
      website?: string;
    };
  };
}

export const useUser = () => {
  const supabase = useSupabase();
  const userRepo = new UserRepository();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Kunde inte hämta användardata');
      if (!user) throw new Error('Ingen inloggad användare');

      try {
        const profile = await userRepo.getProfile(user.id);
        const settings = await userRepo.getSettings(user.id);

        return {
          id: user.id,
          name: profile.name || '',
          email: profile.email,
          avatar_url: profile.avatarUrl,
          settings: {
            name: profile.displayName,
            bio: profile.bio,
            location: profile.location,
            contact: profile.contact
          }
        } as User;
      } catch (error) {
        console.error('Fel vid hämtning av användarprofil:', error);
        throw new Error('Kunde inte hämta användarprofil');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minuter
    cacheTime: 1000 * 60 * 30, // 30 minuter
  });
}; 