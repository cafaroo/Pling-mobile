import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@services/supabase';
import { toast } from '@components/ui/toast';

interface UpdateUserPermissionsParams {
  userId: string;
  role: string;
  customPermissions?: string[];
}

/**
 * Hook för att uppdatera en användares roll och behörigheter
 */
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Mutation för att uppdatera användarens behörigheter
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: async (params: UpdateUserPermissionsParams) => {
      try {
        // Uppdatera användarens roll i profiles-tabellen
        const { error: updateRoleError } = await supabase
          .from('profiles')
          .update({ role: params.role })
          .eq('id', params.userId);

        if (updateRoleError) {
          throw new Error(`Kunde inte uppdatera roll: ${updateRoleError.message}`);
        }

        // Om anpassade behörigheter angivits, hantera dem
        if (params.customPermissions && params.customPermissions.length > 0) {
          // Ta först bort existerande behörigheter
          const { error: deleteError } = await supabase
            .from('user_permissions')
            .delete()
            .eq('user_id', params.userId);

          if (deleteError) {
            throw new Error(`Kunde inte ta bort tidigare behörigheter: ${deleteError.message}`);
          }

          // Lägg sedan till nya behörigheter
          const permissionsToInsert = params.customPermissions.map(permission => ({
            user_id: params.userId,
            permission_name: permission,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from('user_permissions')
            .insert(permissionsToInsert);

          if (insertError) {
            throw new Error(`Kunde inte lägga till behörigheter: ${insertError.message}`);
          }
        }

        // Visa bekräftelsemeddelande
        toast.success('Behörigheter uppdaterade');

        return {
          userId: params.userId,
          role: params.role,
          permissions: params.customPermissions || []
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
        setError(new Error(message));
        toast.error(`Fel vid uppdatering av behörigheter: ${message}`);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidera cachen för denna användare så att data hämtas på nytt
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    }
  });

  /**
   * Uppdatera en användares roll och behörigheter
   */
  const updatePermissions = async (params: UpdateUserPermissionsParams) => {
    return mutateAsync(params);
  };

  return {
    updatePermissions,
    isUpdating: isLoading,
    error
  };
}; 