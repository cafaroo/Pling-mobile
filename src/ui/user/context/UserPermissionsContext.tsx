import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { UserRolePermission } from '@/domain/user/value-objects/UserRolePermission';
import { useAuth } from '@/context/AuthContext';

interface UserPermissionData {
  userId: string;
  role: string;
  customPermissions: string[];
}

interface UserPermissionsContextType {
  // Nuvarande användares behörigheter
  permissions: UserPermission[];
  role: UserRolePermission | null;
  
  // Kontrollera behörigheter
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  
  // Status
  isLoading: boolean;
  error: Error | null;
  
  // Hantering
  refreshPermissions: () => Promise<void>;
}

const UserPermissionsContext = createContext<UserPermissionsContextType | undefined>(undefined);

/**
 * Provider för att hantera användarbehörigheter
 */
export const UserPermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  
  // Hämta användarens roll och anpassade behörigheter
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-permissions', authUser?.id],
    queryFn: async (): Promise<UserPermissionData | null> => {
      try {
        if (!authUser) return null;
        
        // Hämta användarens roll från profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (profileError) {
          throw new Error(`Fel vid hämtning av användarroll: ${profileError.message}`);
        }
        
        // Hämta användarens anpassade behörigheter
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('permission_name')
          .eq('user_id', authUser.id);
        
        if (permissionsError) {
          throw new Error(`Fel vid hämtning av behörigheter: ${permissionsError.message}`);
        }
        
        // Skapa behörighetsobjekt
        return {
          userId: authUser.id,
          role: profileData?.role || 'user',
          customPermissions: permissionsData.map(p => p.permission_name)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
        setError(new Error(message));
        throw error;
      }
    },
    enabled: !!authUser,
  });
  
  // Beräkna användarbehörigheter från data
  const roleObject = data ? UserRolePermission.create(data.role, []) : null;
  
  // Kombinera behörigheter från roll och anpassade behörigheter
  const effectivePermissions = React.useMemo(() => {
    if (!data || !roleObject) return [];
    
    // Börja med rollbehörigheter
    const perms = [...roleObject.permissionObjects];
    
    // Lägg till anpassade behörigheter som inte redan finns
    if (data.customPermissions && data.customPermissions.length > 0) {
      data.customPermissions.forEach(permName => {
        try {
          const permObject = UserPermission.create(permName).value;
          if (!perms.some(p => p.name === permName)) {
            perms.push(permObject);
          }
        } catch (error) {
          console.error(`Invalid permission: ${permName}`, error);
        }
      });
    }
    
    return perms;
  }, [data, roleObject]);
  
  // Kontrollera om användaren har en specifik behörighet
  const hasPermission = (permission: string): boolean => {
    return effectivePermissions.some(p => p.name === permission || 
      p.includesPermission(permission));
  };
  
  // Kontrollera om användaren har en specifik roll
  const hasRole = (role: string): boolean => {
    if (!roleObject) return false;
    return roleObject.role === role;
  };
  
  // Uppdatera behörigheter (t.ex. efter ändringar)
  const refreshPermissions = async (): Promise<void> => {
    if (!authUser) return;
    
    await queryClient.invalidateQueries({ queryKey: ['user-permissions', authUser.id] });
    refetch();
  };
  
  // Värden att exponera via kontexten
  const contextValue: UserPermissionsContextType = {
    permissions: effectivePermissions,
    role: roleObject,
    hasPermission,
    hasRole,
    isLoading,
    error,
    refreshPermissions,
  };
  
  return (
    <UserPermissionsContext.Provider value={contextValue}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

/**
 * Hook för att använda användarbehörigheter
 */
export const useUserPermissions = (): UserPermissionsContextType => {
  const context = useContext(UserPermissionsContext);
  
  if (context === undefined) {
    throw new Error('useUserPermissions måste användas inom en UserPermissionsProvider');
  }
  
  return context;
}; 