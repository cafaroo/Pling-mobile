import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { User } from '@/types';

// Define the auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Handle navigation after auth state changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)');
    }
  }, [user, isInitialized]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Check if there's a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          handleAuthChange(session.user.id, session.user.email);
        } else {
          setUser(null);
          if (!isInitialized) {
            setIsInitialized(true);
          }
        }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          if (session?.user) {
            handleAuthChange(session.user.id, session.user.email);
          } else {
            setUser(null);
            setIsLoading(false);
            if (!isInitialized) {
              setIsInitialized(true);
            }
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      mounted = false;
    };
  }, [isMounted]);

  // Handle authentication change
  const handleAuthChange = async (userId: string, email: string | undefined) => {
    try {
      // Get user profile from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      let userData = data;

      // If no profile exists, create one
      if (!userData && email) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: email,
              name: null,
              avatar_url: null,
            }
          ])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        userData = newProfile;
      }

      if (userData) {
        // Set user data
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatar_url,
        });

        setIsInitialized(true);
        setIsLoading(false);

        // Only navigate if the component is mounted and initialization is complete
        if (isMounted && isInitialized) {
          router.push('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Error handling auth change:', error);
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      router.replace('/(auth)');
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (!data?.user) {
        throw new Error('No user data returned');
      }

      return data;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim()
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      throw new Error(error.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // Check if user already exists
      setIsLoading(true);

      // Create new account
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, signInWithMagicLink, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}