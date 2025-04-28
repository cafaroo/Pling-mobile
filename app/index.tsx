import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  
  // If we're still loading the auth state, don't redirect
  if (isLoading) return null;
  
  // If user is logged in, redirect to the tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }
  
  // Otherwise, redirect to the auth screen
  return <Redirect href="/(auth)" />;
}