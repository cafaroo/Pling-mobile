import { useContext, useCallback } from 'react';
import { SubscriptionContext } from '../components/subscription/SubscriptionProvider';

/**
 * Hook för att kontrollera åtkomst till funktioner baserat på
 * användarens prenumerationsplan.
 */
export const useFeatureFlags = () => {
  const { subscriptionService, featureFlagService, activeOrganization } = useContext(SubscriptionContext);

  /**
   * Kontrollerar om en specifik funktion är tillgänglig 
   * för den aktiva organisationen.
   * 
   * @param featureId - ID för funktionen att kontrollera
   * @returns Promise som löses med ett boolean-värde
   */
  const hasFeatureAccess = useCallback(async (featureId: string): Promise<boolean> => {
    if (!activeOrganization || !featureFlagService) {
      return false;
    }

    const result = await featureFlagService.checkFeatureAccess(
      activeOrganization.id,
      featureId
    );

    return result.allowed;
  }, [activeOrganization, featureFlagService]);

  /**
   * Kontrollerar om den aktiva organisationen har tillräcklig kvot
   * för att använda en viss mängd av en resurs.
   * 
   * @param metricName - Namnet på resursmåttet (t.ex. "teamMembers")
   * @param requestedAmount - Begärd mängd att kontrollera
   * @returns Promise som löses med ett boolean-värde
   */
  const checkUsageLimit = useCallback(async (
    metricName: string,
    requestedAmount: number
  ): Promise<boolean> => {
    if (!activeOrganization || !featureFlagService) {
      return false;
    }

    const result = await featureFlagService.checkUsageLimit(
      activeOrganization.id, 
      metricName, 
      requestedAmount
    );

    return result.allowed;
  }, [activeOrganization, featureFlagService]);

  /**
   * Hämtar alla tillgängliga funktioner för den aktiva organisationen.
   * 
   * @returns Promise som löses med en array av funktions-ID:n
   */
  const getAvailableFeatures = useCallback(async (): Promise<string[]> => {
    if (!activeOrganization || !featureFlagService) {
      return [];
    }

    return await featureFlagService.getAvailableFeatures(activeOrganization.id);
  }, [activeOrganization, featureFlagService]);

  /**
   * Hämtar alla begränsningar för den aktiva organisationen.
   * 
   * @returns Promise som löses med ett objekt innehållande begränsningar
   */
  const getSubscriptionLimits = useCallback(async (): Promise<Record<string, number>> => {
    if (!activeOrganization || !featureFlagService) {
      return {};
    }

    return await featureFlagService.getSubscriptionLimits(activeOrganization.id);
  }, [activeOrganization, featureFlagService]);

  /**
   * Uppdaterar användningsdata för den aktiva organisationen.
   * 
   * @param metricName - Namnet på resursmåttet (t.ex. "teamMembers")
   * @param newValue - Nytt värde för resursmåttet
   */
  const updateUsage = useCallback(async (
    metricName: string,
    newValue: number
  ): Promise<void> => {
    if (!activeOrganization || !featureFlagService) {
      return;
    }

    await featureFlagService.updateUsage(
      activeOrganization.id,
      metricName,
      newValue
    );
  }, [activeOrganization, featureFlagService]);

  return {
    hasFeatureAccess,
    checkUsageLimit,
    getAvailableFeatures,
    getSubscriptionLimits,
    updateUsage,
  };
}; 