import { useCallback } from 'react';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';
import { useSubscriptionContext } from './useSubscriptionContext.tsx';
import { Subscription } from '@/domain/subscription/entities/Subscription';
import { SubscriptionStatus, SubscriptionUsage, FeatureFlag } from '@/domain/subscription/value-objects/SubscriptionTypes';
import { createSubscriptionErrorContext } from '../utils/errorUtils';

/**
 * Hook för standardiserad interaktion med prenumerationer
 * 
 * Implementerar hooks för att:
 * - Hämta prenumerationer
 * - Kontrollera feature flags
 * - Spåra användning
 * - Uppdatera prenumerationer
 */
export function useSubscriptionStandardized() {
  const {
    subscriptionRepository,
    subscriptionService,
    featureFlagService,
    usageTrackingService,
    eventPublisher
  } = useSubscriptionContext();
  
  /**
   * Hämtar prenumeration för en organisation
   */
  const useOrganizationSubscription = createStandardizedQuery({
    queryKeyPrefix: 'subscription',
    buildQueryKey: (organizationId: string | undefined) => ['subscription', 'organization', organizationId],
    queryFn: async (organizationId: string | undefined) => {
      if (!organizationId) return null;
      
      const result = await subscriptionRepository.getActiveByOrganizationId(new UniqueId(organizationId));
      
      return unwrapResult(result);
    },
    enabled: (organizationId) => !!organizationId,
    errorContext: (organizationId) => ({
      ...createSubscriptionErrorContext('getOrganizationSubscription'),
      details: { organizationId }
    }),
    staleTime: 300000 // 5 minuter
  });
  
  /**
   * Hämtar alla prenumerationer för en organisation
   */
  const useAllOrganizationSubscriptions = createStandardizedQuery({
    queryKeyPrefix: 'allSubscriptions',
    buildQueryKey: (organizationId: string | undefined) => ['subscriptions', 'all', 'organization', organizationId],
    queryFn: async (organizationId: string | undefined) => {
      if (!organizationId) return [];
      
      const result = await subscriptionRepository.getAllByOrganizationId(new UniqueId(organizationId));
      
      return unwrapResult(result);
    },
    enabled: (organizationId) => !!organizationId,
    errorContext: (organizationId) => ({
      ...createSubscriptionErrorContext('getAllOrganizationSubscriptions'),
      details: { organizationId }
    }),
    staleTime: 300000 // 5 minuter
  });
  
  /**
   * Kontrollerar om en feature är tillgänglig för en organisation
   */
  const useFeatureFlag = createStandardizedQuery({
    queryKeyPrefix: 'featureFlag',
    buildQueryKey: (params: { organizationId: string, featureFlag: FeatureFlag }) => 
      ['featureFlag', params.organizationId, params.featureFlag],
    queryFn: async (params: { organizationId: string, featureFlag: FeatureFlag }) => {
      if (!params.organizationId || !params.featureFlag) return false;
      
      const isFeatureEnabled = await featureFlagService.isFeatureEnabled(
        new UniqueId(params.organizationId),
        params.featureFlag
      );
      
      return isFeatureEnabled;
    },
    enabled: (params) => {
      if (!params) return false;
      return !!params.organizationId && !!params.featureFlag;
    },
    errorContext: (params) => ({
      ...createSubscriptionErrorContext('checkFeatureFlag'),
      details: { 
        organizationId: params.organizationId, 
        featureFlag: params.featureFlag 
      }
    }),
    staleTime: 600000 // 10 minuter
  });
  
  /**
   * Spårar användning av en feature
   */
  const useTrackUsage = createStandardizedMutation({
    mutationFn: async (
      params: { 
        subscriptionId: string, 
        usage: Partial<SubscriptionUsage> 
      }, 
      updateProgress?: (progress: ProgressInfo) => void
    ) => {
      updateProgress?.({ percent: 30, message: 'Spårar användning...' });
      
      const result = await usageTrackingService.trackUsage(
        new UniqueId(params.subscriptionId),
        params.usage
      );
      
      updateProgress?.({ percent: 100, message: 'Användning spårad!' });
      
      return unwrapResult(result);
    },
    errorContext: (variables) => ({
      ...createSubscriptionErrorContext('trackUsage'),
      details: { 
        subscriptionId: variables.subscriptionId,
        usage: variables.usage
      }
    })
  });
  
  /**
   * Uppdaterar status för en prenumeration
   */
  const useUpdateSubscriptionStatus = createStandardizedMutation({
    mutationFn: async (
      params: { 
        subscriptionId: string, 
        status: SubscriptionStatus 
      }, 
      updateProgress?: (progress: ProgressInfo) => void
    ) => {
      updateProgress?.({ percent: 20, message: 'Uppdaterar prenumerationsstatus...' });
      
      const id = new UniqueId(params.subscriptionId);
      const getResult = await subscriptionRepository.getById(id);
      
      if (getResult.isFailure()) {
        throw new Error(`Could not find subscription with id ${params.subscriptionId}`);
      }
      
      const subscription = getResult.getValue();
      if (!subscription) {
        throw new Error(`Subscription not found with id ${params.subscriptionId}`);
      }
      
      updateProgress?.({ percent: 50, message: 'Ändrar status...' });
      
      subscription.updateStatus(params.status);
      
      const saveResult = await subscriptionRepository.save(subscription);
      
      updateProgress?.({ percent: 100, message: 'Status uppdaterad!' });
      
      return unwrapResult(saveResult);
    },
    errorContext: (variables) => ({
      ...createSubscriptionErrorContext('updateSubscriptionStatus'),
      details: { 
        subscriptionId: variables.subscriptionId,
        status: variables.status
      }
    }),
    invalidateQueryKey: (variables) => [
      ['subscription', 'organization'],
      ['subscriptions', 'all', 'organization']
    ]
  });
  
  /**
   * Kontrollmönster för vanliga prenumerationskontroller
   * 
   * En hjälpfunktion som förenklad kontroll av feature flags
   */
  const useSubscriptionControls = (organizationId: string | undefined) => {
    const { data: subscription, isLoading, error } = useOrganizationSubscription(organizationId);
    
    // Wrapper för att kontrollera feature flags
    const hasFeature = useCallback(
      (featureFlag: FeatureFlag) => {
        if (!subscription) return false;
        return featureFlagService.isFeatureEnabled(new UniqueId(organizationId || ''), featureFlag);
      },
      [subscription, organizationId]
    );
    
    // Wrapper för att spåra användning
    const trackFeatureUsage = useCallback(
      async (usage: Partial<SubscriptionUsage>) => {
        if (!subscription) return;
        await usageTrackingService.trackUsage(
          new UniqueId(subscription.id.toString()),
          usage
        );
      },
      [subscription]
    );
    
    return {
      subscription,
      isLoading,
      error,
      hasFeature,
      trackFeatureUsage,
      isActive: subscription?.isActive() || false
    };
  };
  
  return {
    // Data hämtning
    useOrganizationSubscription,
    useAllOrganizationSubscriptions,
    
    // Feature kontroll
    useFeatureFlag,
    
    // Användningsspårning
    useTrackUsage,
    
    // Statusändringar
    useUpdateSubscriptionStatus,
    
    // Kombinerad kontroll
    useSubscriptionControls
  };
} 