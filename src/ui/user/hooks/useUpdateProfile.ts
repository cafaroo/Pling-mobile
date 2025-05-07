import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase';

interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          display_name: data.displayName,
          bio: data.bio,
          location: data.location,
          avatar_url: data.avatarUrl,
          contact_email: data.contact.email,
          contact_phone: data.contact.phone,
          contact_website: data.contact.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw new Error('Kunde inte uppdatera profilen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}; 