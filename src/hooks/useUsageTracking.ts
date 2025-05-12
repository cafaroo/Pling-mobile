import { useContext, useCallback, useState, useEffect } from 'react';
import { SubscriptionContext } from '../components/subscription/SubscriptionProvider';
import { UsageTrackingService } from '../domain/subscription/services/UsageTrackingService';
import { SupabaseSubscriptionRepository } from '../infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';

/**
 * Hook för att spåra och uppdatera användningsdata för den
 * aktiva organisationen.
 */
export const useUsageTracking = () => {
  const { activeOrganization } = useContext(SubscriptionContext);
  const [usageTrackingService] = useState(() => 
    new UsageTrackingService(new SupabaseSubscriptionRepository())
  );
  const [currentUsage, setCurrentUsage] = useState<Record<string, number>>({});
  const [exceededLimits, setExceededLimits] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Uppdaterar antal teammedlemmar.
   * 
   * @param memberCount - Antal teammedlemmar
   */
  const updateTeamMembersCount = useCallback(async (memberCount: number): Promise<void> => {
    if (!activeOrganization) return;

    try {
      await usageTrackingService.updateTeamMembersCount(
        activeOrganization.id,
        memberCount
      );
      await refreshUsageData();
    } catch (error) {
      console.error('Fel vid uppdatering av teammedlemmar:', error);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Uppdaterar medialagring i MB.
   * 
   * @param storageMB - Använd medialagring i MB
   */
  const updateMediaStorage = useCallback(async (storageMB: number): Promise<void> => {
    if (!activeOrganization) return;

    try {
      await usageTrackingService.updateMediaStorage(
        activeOrganization.id,
        storageMB
      );
      await refreshUsageData();
    } catch (error) {
      console.error('Fel vid uppdatering av medialagring:', error);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Uppdaterar antal anpassade dashboards.
   * 
   * @param dashboardCount - Antal dashboards
   */
  const updateCustomDashboardsCount = useCallback(async (dashboardCount: number): Promise<void> => {
    if (!activeOrganization) return;

    try {
      await usageTrackingService.updateCustomDashboardsCount(
        activeOrganization.id,
        dashboardCount
      );
      await refreshUsageData();
    } catch (error) {
      console.error('Fel vid uppdatering av dashboards:', error);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Uppdaterar antal API-anrop.
   * 
   * @param requestCount - Antal API-anrop
   */
  const updateApiRequestCount = useCallback(async (requestCount: number): Promise<void> => {
    if (!activeOrganization) return;

    try {
      await usageTrackingService.updateApiRequestCount(
        activeOrganization.id,
        requestCount
      );
      await refreshUsageData();
    } catch (error) {
      console.error('Fel vid uppdatering av API-anrop:', error);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Ökar API-anrop med ett visst antal.
   * 
   * @param incrementBy - Antal att öka med, standard 1
   */
  const incrementApiRequestCount = useCallback(async (incrementBy: number = 1): Promise<void> => {
    if (!activeOrganization) return;

    try {
      await usageTrackingService.incrementApiRequestCount(
        activeOrganization.id,
        incrementBy
      );
      // Vi uppdaterar inte användningsdata här för att undvika för många uppdateringar
    } catch (error) {
      console.error('Fel vid ökning av API-anrop:', error);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Uppdaterar användningsdata från servern.
   */
  const refreshUsageData = useCallback(async (): Promise<void> => {
    if (!activeOrganization) {
      setCurrentUsage({});
      setExceededLimits({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [usage, exceeded] = await Promise.all([
        usageTrackingService.getCurrentUsage(activeOrganization.id),
        usageTrackingService.checkExceededLimits(activeOrganization.id)
      ]);
      
      setCurrentUsage(usage);
      setExceededLimits(exceeded);
    } catch (error) {
      console.error('Fel vid uppdatering av användningsdata:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization, usageTrackingService]);

  /**
   * Kontrollerar om en specifik gräns har överskridits.
   * 
   * @param metricName - Namn på metriken att kontrollera
   * @returns True om gränsen har överskridits, annars false
   */
  const hasExceededLimit = useCallback((metricName: string): boolean => {
    return exceededLimits[metricName] === true;
  }, [exceededLimits]);

  // Ladda användningsdata när organisationen ändras
  useEffect(() => {
    refreshUsageData();
  }, [activeOrganization, refreshUsageData]);

  return {
    currentUsage,
    exceededLimits,
    isLoading,
    updateTeamMembersCount,
    updateMediaStorage,
    updateCustomDashboardsCount,
    updateApiRequestCount,
    incrementApiRequestCount,
    refreshUsageData,
    hasExceededLimit
  };
}; 