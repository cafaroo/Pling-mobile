import { DefaultFeatureFlagService } from '@/domain/subscription/services/DefaultFeatureFlagService';
import { FeatureFlagService, FeatureAccessResult } from '@/domain/subscription/interfaces/FeatureFlagService';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';

describe('FeatureFlagService', () => {
  let featureFlagService: FeatureFlagService;
  let mockSubscriptionRepository: any;
  
  // Testdata
  const testOrgId = 'org-123';
  const testFeatureId = 'premium_analytics';
  const testMetricName = 'teamMembers';
  
  // Mock för prenumerationsdata
  const mockActivePremiumPlan = {
    id: 'plan-premium',
    displayName: 'Premium',
    features: [
      { id: 'premium_analytics', name: 'Premium Analytics', description: 'Avancerad statistik', enabled: true },
      { id: 'advanced_reporting', name: 'Advanced Reporting', description: 'Avancerade rapporter', enabled: true },
      { id: 'custom_branding', name: 'Custom Branding', description: 'Anpassad varumärkning', enabled: true }
    ],
    limits: {
      teamMembers: 100,
      teams: 50,
      storage: 100
    }
  };
  
  const mockFreePlan = {
    id: 'plan-free',
    displayName: 'Free',
    features: [
      { id: 'basic_analytics', name: 'Basic Analytics', description: 'Grundläggande statistik', enabled: true },
      { id: 'premium_analytics', name: 'Premium Analytics', description: 'Avancerad statistik', enabled: false },
      { id: 'custom_branding', name: 'Custom Branding', description: 'Anpassad varumärkning', enabled: false }
    ],
    limits: {
      teamMembers: 10,
      teams: 3,
      storage: 5
    }
  };
  
  // Mock för användningsstatistik
  const mockUsage = {
    teamMembers: 75,
    teams: 25,
    storage: 50
  };

  beforeEach(() => {
    // Skapa mock repository
    mockSubscriptionRepository = {
      getByOrganizationId: jest.fn().mockImplementation((orgId) => {
        if (orgId === testOrgId) {
          return Promise.resolve({
            id: 'sub-1',
            organizationId: testOrgId,
            planId: 'plan-premium',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        } else if (orgId === 'org-free') {
          return Promise.resolve({
            id: 'sub-2',
            organizationId: 'org-free',
            planId: 'plan-free',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        } else if (orgId === 'org-inactive') {
          return Promise.resolve({
            id: 'sub-3',
            organizationId: 'org-inactive',
            planId: 'plan-premium',
            status: 'cancelled',
            currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000)
          });
        }
        return Promise.resolve(null);
      }),
      
      getSubscriptionPlan: jest.fn().mockImplementation((planId) => {
        if (planId === 'plan-premium') {
          return Promise.resolve(mockActivePremiumPlan);
        } else if (planId === 'plan-free') {
          return Promise.resolve(mockFreePlan);
        }
        return Promise.resolve(null);
      }),
      
      getUsageMetrics: jest.fn().mockImplementation((orgId) => {
        if (orgId === testOrgId) {
          return Promise.resolve(mockUsage);
        } else if (orgId === 'org-approaching-limit') {
          return Promise.resolve({
            teamMembers: 95,
            teams: 45,
            storage: 90
          });
        } else if (orgId === 'org-at-limit') {
          return Promise.resolve({
            teamMembers: 100,
            teams: 50,
            storage: 100
          });
        }
        return Promise.resolve({
          teamMembers: 0,
          teams: 0,
          storage: 0
        });
      }),
      
      updateUsageMetric: jest.fn().mockResolvedValue(undefined)
    };
    
    // Skapa service med vår mock
    featureFlagService = new DefaultFeatureFlagService(mockSubscriptionRepository);
  });

  describe('isFeatureEnabled', () => {
    it('ska returnera true för en aktiverad funktion', async () => {
      const result = await featureFlagService.isFeatureEnabled(
        new UniqueId(testOrgId),
        'premium_analytics'
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
    });
    
    it('ska returnera false för en funktion som inte är aktiverad i planen', async () => {
      const result = await featureFlagService.isFeatureEnabled(
        new UniqueId('org-free'),
        'premium_analytics'
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska hantera fel när prenumerationen inte kan hittas', async () => {
      const result = await featureFlagService.isFeatureEnabled(
        new UniqueId('org-nonexistent'),
        'premium_analytics'
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska hantera fel i repository-lagret', async () => {
      // Override mock för att kasta ett fel
      mockSubscriptionRepository.getByOrganizationId = jest.fn().mockImplementation(() => {
        throw new Error('Repository error');
      });
      
      const result = await featureFlagService.isFeatureEnabled(
        new UniqueId(testOrgId),
        'premium_analytics'
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Failed to check feature flag');
    });
  });

  describe('getFeatureValue', () => {
    it('ska returnera konfigurationsvärde för en funktion', async () => {
      const defaultValue = 50;
      const result = await featureFlagService.getFeatureValue(
        new UniqueId(testOrgId),
        'max_file_size',
        defaultValue
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(defaultValue);
    });
    
    it('ska returnera defaultValue om funktionen inte finns', async () => {
      const defaultValue = { enabled: false, limit: 10 };
      const result = await featureFlagService.getFeatureValue(
        new UniqueId(testOrgId),
        'nonexistent_feature',
        defaultValue
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(defaultValue);
    });
    
    it('ska hantera fel i repository-lagret', async () => {
      // Override mock för att kasta ett fel
      mockSubscriptionRepository.getByOrganizationId = jest.fn().mockImplementation(() => {
        throw new Error('Repository error');
      });
      
      const result = await featureFlagService.getFeatureValue(
        new UniqueId(testOrgId),
        'max_file_size',
        100
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Failed to get feature value');
    });
  });

  describe('checkFeatureAccess', () => {
    it('ska tillåta åtkomst till funktioner i aktiv plan', async () => {
      const result = await featureFlagService.checkFeatureAccess(
        testOrgId,
        testFeatureId
      );
      
      expect(result.allowed).toBe(true);
    });
    
    it('ska neka åtkomst till funktioner som inte ingår i planen', async () => {
      const result = await featureFlagService.checkFeatureAccess(
        'org-free',
        'premium_analytics'
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('inte tillgänglig');
    });
    
    it('ska neka åtkomst vid inaktiv prenumeration', async () => {
      const result = await featureFlagService.checkFeatureAccess(
        'org-inactive',
        testFeatureId
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('inte aktiv');
    });
    
    it('ska hantera fall där prenumeration saknas', async () => {
      const result = await featureFlagService.checkFeatureAccess(
        'org-nonexistent',
        testFeatureId
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Ingen aktiv prenumeration');
    });
  });

  describe('checkUsageLimit', () => {
    it('ska tillåta användning när gränsen inte är nådd', async () => {
      const result = await featureFlagService.checkUsageLimit(
        testOrgId,
        testMetricName,
        10 // Begär 10 till (75 + 10 = 85, under gränsen på 100)
      );
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.currentUsage).toBe(75);
    });
    
    it('ska neka användning när gränsen skulle överskridas', async () => {
      const result = await featureFlagService.checkUsageLimit(
        testOrgId,
        testMetricName,
        30 // Begär 30 till (75 + 30 = 105, över gränsen på 100)
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('skulle överskrida gränsen');
      expect(result.limit).toBe(100);
      expect(result.currentUsage).toBe(75);
    });
    
    it('ska returnera korrekt information för organisation på sin gräns', async () => {
      const result = await featureFlagService.checkUsageLimit(
        'org-at-limit',
        testMetricName,
        1
      );
      
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(100);
      expect(result.currentUsage).toBe(100);
    });
    
    it('ska returnera tillåten användning för ny organisation', async () => {
      const result = await featureFlagService.checkUsageLimit(
        'org-new',
        testMetricName,
        5
      );
      
      expect(result.allowed).toBe(true);
    });
  });

  describe('updateUsage', () => {
    it('ska uppdatera användningsstatistik korrekt', async () => {
      await featureFlagService.updateUsage(
        testOrgId,
        testMetricName,
        80 // Nytt värde
      );
      
      expect(mockSubscriptionRepository.updateUsageMetric).toHaveBeenCalledWith(
        testOrgId,
        testMetricName,
        80
      );
    });
    
    it('ska hantera fel vid uppdatering', async () => {
      // Override mock för att kasta ett fel
      mockSubscriptionRepository.updateUsageMetric = jest.fn().mockImplementation(() => {
        throw new Error('Update error');
      });
      
      // Metoden kastar inget fel men loggar istället
      expect(async () => {
        await featureFlagService.updateUsage(testOrgId, testMetricName, 80);
      }).not.toThrow();
    });
  });

  describe('getAvailableFeatures', () => {
    it('ska returnera alla tillgängliga funktioner för premium plan', async () => {
      const features = await featureFlagService.getAvailableFeatures(testOrgId);
      
      expect(features).toContain('premium_analytics');
      expect(features).toContain('advanced_reporting');
      expect(features).toContain('custom_branding');
      expect(features.length).toBe(3);
    });
    
    it('ska returnera begränsade funktioner för gratisplan', async () => {
      const features = await featureFlagService.getAvailableFeatures('org-free');
      
      expect(features).toContain('basic_analytics');
      expect(features).not.toContain('premium_analytics');
      expect(features.length).toBe(1);
    });
    
    it('ska returnera tom lista för organisation utan prenumeration', async () => {
      const features = await featureFlagService.getAvailableFeatures('org-nonexistent');
      
      expect(features).toEqual([]);
    });
  });

  describe('getSubscriptionLimits', () => {
    it('ska returnera alla gränser för premium plan', async () => {
      const limits = await featureFlagService.getSubscriptionLimits(testOrgId);
      
      expect(limits).toEqual({
        teamMembers: 100,
        teams: 50,
        storage: 100
      });
    });
    
    it('ska returnera begränsade gränser för gratisplan', async () => {
      const limits = await featureFlagService.getSubscriptionLimits('org-free');
      
      expect(limits).toEqual({
        teamMembers: 10,
        teams: 3,
        storage: 5
      });
    });
    
    it('ska returnera tomt objekt för organisation utan prenumeration', async () => {
      const limits = await featureFlagService.getSubscriptionLimits('org-nonexistent');
      
      expect(limits).toEqual({});
    });
  });
}); 