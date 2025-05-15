import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { FeatureFlagService } from '@/domain/subscription/services/FeatureFlagService';
import { UsageTrackingService } from '@/domain/subscription/services/UsageTrackingService';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';
import { createSubscriptionErrorContext } from '../utils/errorUtils';
import { 
  SubscriptionPlan, 
  SubscriptionStatus,
  FeatureFlag
} from '@/domain/subscription/value-objects/SubscriptionTypes';

/**
 * Hook för hantering av prenumerationer med standardiserad implementation
 * Följer DDD-principer och använder React Query för datahantering
 */
export function useSubscriptionStandardized(
  subscriptionRepository: SubscriptionRepository,
  featureFlagService: FeatureFlagService,
  usageTrackingService: UsageTrackingService
) {
  const queryClient = useQueryClient();

  /**
   * Hämtar prenumerationsinformation för en organisation
   */
  const useOrganizationSubscription = createStandardizedQuery({
    queryKeyPrefix: 'organizationSubscription',
    buildQueryKey: (organizationId: string | undefined) => ['subscription', 'organization', organizationId],
    queryFn: async (organizationId: string | undefined) => {
      if (!organizationId) return null;
      
      const id = new UniqueId(organizationId);
      const result = await subscriptionRepository.findByOrganizationId(id);
      
      return unwrapResult(result);
    },
    enabled: (organizationId) => !!organizationId,
    errorContext: (organizationId) => createSubscriptionErrorContext(
      'getOrganizationSubscription', 
      { organizationId }
    ),
    staleTime: 300000, // 5 minuter
    cacheTime: 600000   // 10 minuter
  });

  /**
   * Kollar om en specifik feature är aktiverad för en organisation
   */
  const useFeatureFlag = createStandardizedQuery({
    queryKeyPrefix: 'featureFlag',
    buildQueryKey: (params: [string | undefined, FeatureFlag]) => 
      ['subscription', 'feature', params[0], params[1]],
    queryFn: async ([organizationId, feature]: [string | undefined, FeatureFlag]) => {
      if (!organizationId || !feature) return false;
      
      const id = new UniqueId(organizationId);
      const result = await featureFlagService.isFeatureEnabled(id, feature);
      
      return unwrapResult(result);
    },
    enabled: ([organizationId, feature]) => !!organizationId && !!feature,
    errorContext: ([organizationId, feature]) => createSubscriptionErrorContext(
      'checkFeatureFlag', 
      { organizationId, feature }
    ),
    staleTime: 300000,  // 5 minuter 
    cacheTime: 600000   // 10 minuter
  });

  /**
   * Hämtar användningsstatistik för en organisation
   */
  const useUsageStatistics = createStandardizedQuery({
    queryKeyPrefix: 'usageStatistics',
    buildQueryKey: (organizationId: string | undefined) => 
      ['subscription', 'usage', organizationId],
    queryFn: async (organizationId: string | undefined) => {
      if (!organizationId) return null;
      
      const id = new UniqueId(organizationId);
      const result = await usageTrackingService.getUsageStatistics(id);
      
      return unwrapResult(result);
    },
    enabled: (organizationId) => !!organizationId,
    errorContext: (organizationId) => createSubscriptionErrorContext(
      'getUsageStatistics', 
      { organizationId }
    ),
    staleTime: 60000,   // 1 minut
    cacheTime: 300000   // 5 minuter
  });

  /**
   * Hämtar prenumerationsplaner som är tillgängliga
   */
  const useSubscriptionPlans = createStandardizedQuery({
    queryKeyPrefix: 'subscriptionPlans',
    queryFn: async () => {
      const result = await subscriptionRepository.getAllPlans();
      return unwrapResult(result);
    },
    staleTime: 3600000, // 1 timme
    cacheTime: 86400000, // 24 timmar
    errorContext: () => createSubscriptionErrorContext('getSubscriptionPlans')
  });

  /**
   * Uppdaterar en organisations prenumerationsplan
   */
  const useUpdateSubscriptionPlan = createStandardizedMutation({
    mutationFn: async (
      variables: { organizationId: string, newPlanId: string }, 
      updateProgress?: (progress: ProgressInfo) => void
    ) => {
      const { organizationId, newPlanId } = variables;
      
      updateProgress?.({ percent: 10, message: 'Validerar begäran...' });
      
      if (!organizationId || !newPlanId) {
        throw new Error('Ogiltiga parametrar för prenumerationsändring');
      }
      
      updateProgress?.({ percent: 30, message: 'Uppdaterar prenumeration...' });
      
      const orgId = new UniqueId(organizationId);
      const result = await subscriptionRepository.updatePlan(orgId, newPlanId);
      
      updateProgress?.({ percent: 80, message: 'Slutför ändringen...' });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress?.({ percent: 100, message: 'Prenumeration uppdaterad!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera prenumerationsrelaterade queries
      queryClient.invalidateQueries({ 
        queryKey: ['subscription', 'organization', variables.organizationId] 
      });
      queryClient.invalidateQueries({
        queryKey: ['subscription', 'usage', variables.organizationId]
      });
      queryClient.invalidateQueries({
        queryKey: ['subscription', 'feature']
      });
    },
    errorContext: (variables) => createSubscriptionErrorContext(
      'updateSubscriptionPlan',
      { organizationId: variables.organizationId, newPlanId: variables.newPlanId }
    )
  });

  /**
   * Spårar användning av en specifik resurs
   */
  const useTrackResourceUsage = createStandardizedMutation({
    mutationFn: async (
      variables: { 
        organizationId: string, 
        resourceType: string, 
        quantity: number 
      },
      updateProgress?: (progress: ProgressInfo) => void
    ) => {
      const { organizationId, resourceType, quantity } = variables;
      
      updateProgress?.({ percent: 50, message: 'Registrerar användning...' });
      
      const orgId = new UniqueId(organizationId);
      const result = await usageTrackingService.trackUsage(
        orgId, 
        resourceType, 
        quantity
      );
      
      updateProgress?.({ percent: 100, message: 'Användning registrerad' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera användningsstatistik efter spårning
      queryClient.invalidateQueries({ 
        queryKey: ['subscription', 'usage', variables.organizationId] 
      });
    },
    errorContext: (variables) => createSubscriptionErrorContext(
      'trackResourceUsage',
      { 
        organizationId: variables.organizationId, 
        resourceType: variables.resourceType,
        quantity: variables.quantity 
      }
    )
  });

  /**
   * Avbryter en prenumeration
   */
  const useCancelSubscription = createStandardizedMutation({
    mutationFn: async (
      variables: { organizationId: string, reason?: string },
      updateProgress?: (progress: ProgressInfo) => void
    ) => {
      const { organizationId, reason } = variables;
      
      updateProgress?.({ percent: 20, message: 'Förbereder avbrytning...' });
      
      const orgId = new UniqueId(organizationId);
      const result = await subscriptionRepository.cancelSubscription(orgId, reason);
      
      updateProgress?.({ percent: 70, message: 'Avbryter prenumeration...' });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress?.({ percent: 100, message: 'Prenumeration avbruten' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera alla relevanta prenumerationsquery
      queryClient.invalidateQueries({ 
        queryKey: ['subscription', 'organization', variables.organizationId] 
      });
    },
    errorContext: (variables) => createSubscriptionErrorContext(
      'cancelSubscription',
      { organizationId: variables.organizationId, reason: variables.reason }
    )
  });

  // Returnera alla hooks
  return {
    useOrganizationSubscription,
    useFeatureFlag,
    useUsageStatistics,
    useSubscriptionPlans,
    useUpdateSubscriptionPlan,
    useTrackResourceUsage,
    useCancelSubscription
  };
} 