import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { getUserTeams } from '@/services/teamService';

// Define the user context type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
};

// Create the user context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the user provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Update user when auth user changes
  useEffect(() => {
    if (authUser) {
      loadUserData(authUser);
      
      // Subscribe to profile changes
      const profileSubscription = supabase
        .channel('public:profiles')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${authUser.id}` },
          (payload) => {
            // Update user when profile changes
            const updatedProfile = payload.new as any;
            setUser(prev => prev ? {
              ...prev,
              name: updatedProfile.name,
              avatarUrl: updatedProfile.avatar_url,
            } : null);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(profileSubscription);
      };
    } else {
      setUser(null);
    }
  }, [authUser]);

  const loadUserData = async (authUser: User) => {
    try {
      setIsLoadingUserData(true);
      
      // Get user's teams
      const teamsData = await getUserTeams(authUser.id);
      
      // Update user with additional data
      setUser({
        ...authUser,
        teams: teamsData
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(authUser);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading: isLoadingUserData }}>
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}