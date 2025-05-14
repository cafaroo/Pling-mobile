import { useState, useEffect } from 'react';

// Enkelt interface för autentiseringsdata
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  isSignedIn: boolean;
}

/**
 * Hook för autentisering - mockversion för att tester ska fungera
 */
export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: { id: 'mock-user-id', email: 'test@example.com', name: 'Testanvändare' },
    isLoading: false,
    error: null,
    isSignedIn: true,
  });

  return authState;
};

export default useAuth; 