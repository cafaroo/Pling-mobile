import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/infrastructure/supabase/hooks/useSupabase';
import { EventBus } from '@/shared/core/EventBus';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { createUser, CreateUserInput } from '../useCases/createUser';

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const eventBus = new EventBus();
  
  const userRepo = new SupabaseUserRepository(supabase, eventBus);

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const result = await createUser({ userRepo })(input);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      // Invalidera alla användarcache
      queryClient.invalidateQueries(['users']);
    },
  });
}; 