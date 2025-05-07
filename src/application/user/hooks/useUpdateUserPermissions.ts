import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Result, err, ok } from '@/shared/core/Result';
import { useSupabase } from '@/services/supabase/useSupabase';

interface UpdateUserPermissionsInput {
  /**
   * Användar-ID
   */
  userId: string;
  
  /**
   * Lista med rollenamn
   */
  roles: string[];
  
  /**
   * Lista med anpassade behörighetsnamn
   */
  customPermissions?: string[];
}

type UpdateUserPermissionsError = 
  | 'USER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_ROLE'
  | 'INVALID_PERMISSION'
  | 'OPERATION_FAILED';

/**
 * Hook för att uppdatera användarbehörigheter
 */
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  const { supabase } = useSupabase();
  
  return useMutation<void, Error, UpdateUserPermissionsInput, unknown>({
    mutationFn: async (input: UpdateUserPermissionsInput): Promise<void> => {
      try {
        // Hämta användaren för att verifiera att den finns
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', input.userId)
          .single();
        
        if (userError || !user) {
          throw new Error('USER_NOT_FOUND');
        }
        
        // Uppdatera roller
        const { error: rolesError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', input.userId);
        
        if (rolesError) {
          console.error('Fel vid borttagning av befintliga roller:', rolesError);
          throw new Error('OPERATION_FAILED');
        }
        
        // Om det finns roller att lägga till
        if (input.roles && input.roles.length > 0) {
          const rolesToInsert = input.roles.map(role => ({
            user_id: input.userId,
            role_name: role
          }));
          
          const { error: insertRolesError } = await supabase
            .from('user_roles')
            .insert(rolesToInsert);
          
          if (insertRolesError) {
            console.error('Fel vid tillägg av roller:', insertRolesError);
            throw new Error('INVALID_ROLE');
          }
        }
        
        // Hantera anpassade behörigheter
        if (input.customPermissions !== undefined) {
          // Ta bort befintliga anpassade behörigheter
          const { error: deletePermissionsError } = await supabase
            .from('user_permissions')
            .delete()
            .eq('user_id', input.userId);
          
          if (deletePermissionsError) {
            console.error('Fel vid borttagning av behörigheter:', deletePermissionsError);
            throw new Error('OPERATION_FAILED');
          }
          
          // Om det finns anpassade behörigheter att lägga till
          if (input.customPermissions.length > 0) {
            const permissionsToInsert = input.customPermissions.map(permission => ({
              user_id: input.userId,
              permission_name: permission
            }));
            
            const { error: insertPermissionsError } = await supabase
              .from('user_permissions')
              .insert(permissionsToInsert);
            
            if (insertPermissionsError) {
              console.error('Fel vid tillägg av behörigheter:', insertPermissionsError);
              throw new Error('INVALID_PERMISSION');
            }
          }
        }
        
        // Uppdatera User-queryns data
        queryClient.invalidateQueries(['user', input.userId]);
        queryClient.invalidateQueries(['users']);
        
      } catch (error: any) {
        console.error('Fel vid uppdatering av användarbehörigheter:', error);
        
        if (error.message === 'USER_NOT_FOUND' || 
            error.message === 'PERMISSION_DENIED' || 
            error.message === 'INVALID_ROLE' || 
            error.message === 'INVALID_PERMISSION') {
          throw new Error(error.message);
        }
        
        throw new Error('OPERATION_FAILED');
      }
    },
    
    // Optimistisk uppdatering av användaren i cachen
    onMutate: async (input) => {
      // Avbryt pågående förfrågningar för användaren
      await queryClient.cancelQueries(['user', input.userId]);
      
      // Spara tidigare data
      const previousUserData = queryClient.getQueryData(['user', input.userId]);
      
      // Optimistiskt uppdatera cachen
      queryClient.setQueryData(['user', input.userId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          roles: input.roles,
          customPermissions: input.customPermissions
        };
      });
      
      return { previousUserData };
    },
    
    // Vid fel, återställ cachen
    onError: (err, variables, context: any) => {
      if (context?.previousUserData) {
        queryClient.setQueryData(['user', variables.userId], context.previousUserData);
      }
    },
    
    // Oavsett resultat, uppdatera användardata
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['user', variables.userId]);
    }
  });
}; 