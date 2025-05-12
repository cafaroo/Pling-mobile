import React, { createContext, useContext, useEffect, useState } from 'react';
import { UniqueId } from '../../domain/core/UniqueId';
import { SubscriptionService } from '../../domain/subscription/interfaces/SubscriptionService';
import { NoOpSubscriptionService } from '../../domain/subscription/services/NoOpSubscriptionService';
import { FeatureFlagService } from '../../domain/subscription/interfaces/FeatureFlagService';
import { DefaultFeatureFlagService } from '../../domain/subscription/services/DefaultFeatureFlagService';
import { SupabaseSubscriptionRepository } from '../../infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';

interface Organization {
  id: string;
  name: string;
}

interface SubscriptionContextType {
  subscriptionService: SubscriptionService;
  featureFlagService?: FeatureFlagService;
  activeOrganization?: Organization;
  currentPlanName: string;
  hasActiveSubscription: boolean;
  canAddMoreUsers: (currentCount: number, addCount: number) => Promise<boolean>;
  canUseMoreStorage: (currentSizeMB: number, addSizeMB: number) => Promise<boolean>;
  canCreateMoreDashboards: (currentCount: number, addCount: number) => Promise<boolean>;
  canUseApiResources: () => Promise<boolean>;
  hasFeatureAccess: (featureId: string) => Promise<boolean>;
  loadingSubscription: boolean;
  subscriptionStatus: {
    status?: string;
    displayName?: string;
    isActive?: boolean;
    daysUntilRenewal?: number;
    isInTrial?: boolean;
    daysLeftInTrial?: number;
    isCanceled?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null;
  usagePercentages: {
    teamMembers: number;
    mediaStorage: number;
    customDashboards?: number;
    apiRequests?: number;
  };
  updateUsageMetrics: (metrics: {
    teamMembers?: number;
    mediaStorage?: number;
    apiRequests?: number;
  }) => Promise<void>;
  refreshSubscriptionData: () => Promise<void>;
}

interface SubscriptionProviderProps {
  children: React.ReactNode;
  organizationId?: UniqueId;
  subscriptionService?: SubscriptionService;
  featureFlagService?: FeatureFlagService;
  activeOrganization?: Organization;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export { SubscriptionContext };

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription måste användas inom en SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  organizationId,
  activeOrganization,
  subscriptionService = new NoOpSubscriptionService(),
  featureFlagService,
}) => {
  const [currentPlanName, setCurrentPlanName] = useState<string>('basic');
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [loadingSubscription, setLoadingSubscription] = useState<boolean>(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    status?: string;
    displayName?: string;
    isActive?: boolean;
    daysUntilRenewal?: number;
    isInTrial?: boolean;
    daysLeftInTrial?: number;
    isCanceled?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);
  const [usagePercentages, setUsagePercentages] = useState<{
    teamMembers: number;
    mediaStorage: number;
    customDashboards?: number;
    apiRequests?: number;
  }>({
    teamMembers: 0,
    mediaStorage: 0,
  });

  // Skapa en feature flag service om ingen har angivits
  const [internalFeatureFlagService] = useState<FeatureFlagService>(() => {
    if (featureFlagService) {
      return featureFlagService;
    }
    // Om ingen feature flag service har angivits, skapa en ny med repository
    return new DefaultFeatureFlagService(
      // Här skulle vi ta SubscriptionRepository från en provider, men för enkelhetens skull
      // skapar vi en direkt. I en riktigt app skulle detta komma från en provider/factory.
      new SupabaseSubscriptionRepository()
    );
  });

  const loadSubscriptionData = async () => {
    if (!organizationId) {
      setLoadingSubscription(false);
      return;
    }

    setLoadingSubscription(true);
    try {
      const [
        planName,
        activeStatus,
        statusInfo,
        usageData,
      ] = await Promise.all([
        subscriptionService.getCurrentPlanName(organizationId),
        subscriptionService.hasActiveSubscription(organizationId),
        subscriptionService.getSubscriptionStatusInfo(organizationId),
        subscriptionService.getUsagePercentages(organizationId),
      ]);

      setCurrentPlanName(planName);
      setHasActiveSubscription(activeStatus);
      setSubscriptionStatus(statusInfo);
      setUsagePercentages(usageData);
    } catch (error) {
      console.error('Fel vid hämtning av prenumerationsdata:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [organizationId]);

  const canAddMoreUsers = async (currentCount: number, addCount: number): Promise<boolean> => {
    if (!organizationId) return false;
    return await subscriptionService.canAddMoreUsers(organizationId, currentCount, addCount);
  };

  const canUseMoreStorage = async (currentSizeMB: number, addSizeMB: number): Promise<boolean> => {
    if (!organizationId) return false;
    return await subscriptionService.canUseMoreStorage(organizationId, currentSizeMB, addSizeMB);
  };

  const canCreateMoreDashboards = async (currentCount: number, addCount: number): Promise<boolean> => {
    if (!organizationId) return false;
    return await subscriptionService.canCreateMoreDashboards(organizationId, currentCount, addCount);
  };

  const canUseApiResources = async (): Promise<boolean> => {
    if (!organizationId) return false;
    return await subscriptionService.canUseApiResources(organizationId);
  };

  const hasFeatureAccess = async (featureId: string): Promise<boolean> => {
    if (!organizationId) return false;
    
    // Om vi har en feature flag service, använd den först
    if (internalFeatureFlagService) {
      try {
        const result = await internalFeatureFlagService.checkFeatureAccess(
          organizationId.toString(), 
          featureId
        );
        return result.allowed;
      } catch (error) {
        console.error('Fel vid kontroll av funktionsåtkomst via FeatureFlagService:', error);
        // Fallback till subscriptionService om FeatureFlagService misslyckas
      }
    }
    
    // Fallback eller om ingen feature flag service finns
    return await subscriptionService.hasFeatureAccess(organizationId, featureId);
  };

  const updateUsageMetrics = async (metrics: {
    teamMembers?: number;
    mediaStorage?: number;
    apiRequests?: number;
  }): Promise<void> => {
    if (!organizationId) return;
    
    // Uppdatera användningsdata via subscription service
    await subscriptionService.updateUsageMetrics(organizationId, metrics);
    
    // Uppdatera även via feature flag service om den finns
    if (internalFeatureFlagService) {
      try {
        if (metrics.teamMembers !== undefined) {
          await internalFeatureFlagService.updateUsage(
            organizationId.toString(),
            'teamMembers',
            metrics.teamMembers
          );
        }
        
        if (metrics.mediaStorage !== undefined) {
          await internalFeatureFlagService.updateUsage(
            organizationId.toString(),
            'mediaStorage',
            metrics.mediaStorage
          );
        }
        
        if (metrics.apiRequests !== undefined) {
          await internalFeatureFlagService.updateUsage(
            organizationId.toString(),
            'apiRequests',
            metrics.apiRequests
          );
        }
      } catch (error) {
        console.error('Fel vid uppdatering av användningsdata via FeatureFlagService:', error);
      }
    }
    
    await loadSubscriptionData();
  };

  const refreshSubscriptionData = async (): Promise<void> => {
    await loadSubscriptionData();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionService,
        featureFlagService: internalFeatureFlagService,
        activeOrganization: activeOrganization ? {
          id: organizationId?.toString() || '',
          name: activeOrganization.name || '',
        } : undefined,
        currentPlanName,
        hasActiveSubscription,
        canAddMoreUsers,
        canUseMoreStorage,
        canCreateMoreDashboards,
        canUseApiResources,
        hasFeatureAccess,
        loadingSubscription,
        subscriptionStatus,
        usagePercentages,
        updateUsageMetrics,
        refreshSubscriptionData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 