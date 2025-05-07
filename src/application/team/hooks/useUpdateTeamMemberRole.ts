import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Result, ok, err } from '@/shared/core/Result';
import { useSupabase } from '@/services/supabase/useSupabase';

interface UpdateTeamMemberRoleInput {
  /**
   * Team-ID
   */
  teamId: string;
  
  /**
   * Användar-ID
   */
  userId: string;
  
  /**
   * Ny roll för medlemmen
   */
  role: string;
  
  /**
   * Lista med anpassade behörighetsnamn (valfritt)
   */
  customPermissions?: string[];
}

type UpdateTeamMemberRoleError = 
  | 'TEAM_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'MEMBER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_ROLE'
  | 'INVALID_PERMISSION'
  | 'OPERATION_FAILED';

/**
 * Hook för att uppdatera en teammedlems roll och behörigheter
 */
export const useUpdateTeamMemberRole = () => {
  const queryClient = useQueryClient();
  const { supabase } = useSupabase();
  
  return useMutation<void, Error, UpdateTeamMemberRoleInput, unknown>({
    mutationFn: async (input: UpdateTeamMemberRoleInput): Promise<void> => {
      try {
        // Verifiera att teamet finns
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('id', input.teamId)
          .single();
        
        if (teamError || !team) {
          throw new Error('TEAM_NOT_FOUND');
        }
        
        // Verifiera att användaren finns
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', input.userId)
          .single();
        
        if (userError || !user) {
          throw new Error('USER_NOT_FOUND');
        }
        
        // Verifiera att användaren är medlem i teamet
        const { data: member, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', input.teamId)
          .eq('user_id', input.userId)
          .single();
        
        if (memberError || !member) {
          throw new Error('MEMBER_NOT_FOUND');
        }
        
        // Uppdatera medlemmens roll
        const { error: updateRoleError } = await supabase
          .from('team_members')
          .update({ role: input.role })
          .eq('team_id', input.teamId)
          .eq('user_id', input.userId);
        
        if (updateRoleError) {
          console.error('Fel vid uppdatering av roll:', updateRoleError);
          throw new Error('INVALID_ROLE');
        }
        
        // Hantera anpassade behörigheter om de anges
        if (input.customPermissions !== undefined) {
          // Ta bort befintliga anpassade behörigheter
          const { error: deletePermissionsError } = await supabase
            .from('team_member_permissions')
            .delete()
            .eq('team_id', input.teamId)
            .eq('user_id', input.userId);
          
          if (deletePermissionsError) {
            console.error('Fel vid borttagning av behörigheter:', deletePermissionsError);
            throw new Error('OPERATION_FAILED');
          }
          
          // Om det finns nya anpassade behörigheter att lägga till
          if (input.customPermissions.length > 0) {
            const permissionsToInsert = input.customPermissions.map(permission => ({
              team_id: input.teamId,
              user_id: input.userId,
              permission_name: permission
            }));
            
            const { error: insertPermissionsError } = await supabase
              .from('team_member_permissions')
              .insert(permissionsToInsert);
            
            if (insertPermissionsError) {
              console.error('Fel vid tillägg av behörigheter:', insertPermissionsError);
              throw new Error('INVALID_PERMISSION');
            }
          }
        }
        
        // Uppdatera cache för teammedlemmar
        queryClient.invalidateQueries(['team', input.teamId, 'members']);
        queryClient.invalidateQueries(['team', input.teamId, 'member', input.userId]);
        
      } catch (error: any) {
        console.error('Fel vid uppdatering av teammedlemsroll:', error);
        
        if (error.message === 'TEAM_NOT_FOUND' || 
            error.message === 'USER_NOT_FOUND' ||
            error.message === 'MEMBER_NOT_FOUND' ||
            error.message === 'PERMISSION_DENIED' || 
            error.message === 'INVALID_ROLE' || 
            error.message === 'INVALID_PERMISSION') {
          throw new Error(error.message);
        }
        
        throw new Error('OPERATION_FAILED');
      }
    },
    
    // Optimistisk uppdatering
    onMutate: async (input) => {
      // Avbryt pågående förfrågningar
      await queryClient.cancelQueries(['team', input.teamId, 'member', input.userId]);
      
      // Spara tidigare data
      const previousMemberData = queryClient.getQueryData(['team', input.teamId, 'member', input.userId]);
      
      // Optimistiskt uppdatera cachen
      queryClient.setQueryData(['team', input.teamId, 'member', input.userId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          role: input.role,
          customPermissions: input.customPermissions
        };
      });
      
      return { previousMemberData };
    },
    
    // Vid fel, återställ cachen
    onError: (err, variables, context: any) => {
      if (context?.previousMemberData) {
        queryClient.setQueryData(
          ['team', variables.teamId, 'member', variables.userId], 
          context.previousMemberData
        );
      }
    },
    
    // Uppdatera data oavsett resultat
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['team', variables.teamId, 'members']);
      queryClient.invalidateQueries(['team', variables.teamId, 'member', variables.userId]);
    }
  });
}; 