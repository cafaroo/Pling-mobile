import { useState, useEffect } from 'react';
import { getTeamSubscription, checkFeatureAccess } from '@/services/subscriptionService';
import { Subscription } from '@/types/subscription';

export function useSubscription(teamId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      loadSubscription();
    }
    else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [teamId]);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTeamSubscription(teamId!);
      setSubscription(data);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Could not load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = async (feature: string): Promise<boolean> => {
    if (!teamId) return false;
    return checkFeatureAccess(teamId, feature);
  };

  return {
    subscription,
    isLoading,
    error,
    hasFeature,
    refresh: loadSubscription,
  };
}