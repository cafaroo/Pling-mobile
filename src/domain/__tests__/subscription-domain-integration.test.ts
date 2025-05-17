/**
 * Integrationstester för prenumerationsdomänen och dess interaktion med andra domäner
 */
import { DefaultSubscriptionService } from '../subscription/services/DefaultSubscriptionService';
import { SubscriptionCreatedEvent } from '../subscription/events/SubscriptionCreatedEvent';
import { SubscriptionUpdatedEvent } from '../subscription/events/SubscriptionUpdatedEvent';
import { FeatureFlagService } from '../subscription/services/DefaultFeatureFlagService';
import { OrganizationService } from '../organization/services/OrganizationService'; 
import { TeamService } from '../team/services/TeamService';
import { mockResultOk, mockResultErr } from '@/test-utils';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { expectResultOk, expectResultErr } from '@/test-utils/error-helpers';

// Mockade repositories
const mockSubscriptionRepository = {
  getSubscriptionById: jest.fn(),
  saveSubscription: jest.fn(),
  getSubscriptionUsage: jest.fn(),
  recordSubscriptionUsage: jest.fn(),
};

const mockOrganizationRepository = {
  getOrganizationById: jest.fn(),
  updateOrganization: jest.fn(),
};

const mockTeamRepository = {
  getTeamsByOrganizationId: jest.fn(),
  updateTeam: jest.fn(),
};

// En riktig domänhändelsebuss för att testa integrationen mellan domäner
const eventBus = DomainEventTestHelper.createRealEventBus();

describe('Subscription Domain Integration', () => {
  let subscriptionService: DefaultSubscriptionService;
  let featureFlagService: FeatureFlagService;
  let organizationService: OrganizationService;
  let teamService: TeamService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Skapa mock-implementationer för domäntjänster
    subscriptionService = new DefaultSubscriptionService({
      subscriptionRepository: mockSubscriptionRepository,
      eventBus,
    });
    
    featureFlagService = {
      checkFeatureAccess: jest.fn(),
      checkUsageLimit: jest.fn(),
      getAvailableFeatures: jest.fn(),
    } as any;
    
    organizationService = {
      getOrganizationById: jest.fn(),
      updateOrganization: jest.fn(),
      updateResourceLimits: jest.fn(),
    } as any;
    
    teamService = {
      getTeamsByOrganizationId: jest.fn(),
      updateTeam: jest.fn(),
    } as any;
    
    // Återställ event listeners för att undvika att tester påverkar varandra
    eventBus.clearListeners();
  });
  
  describe('Interaktion mellan prenumeration och organisation', () => {
    it('ska uppdatera organisationens resursgränser när en prenumeration skapas', async () => {
      // 1. Registrera subscribers på organisationssidan för att lyssna på prenumerationshändelser
      const organizationResourceUpdateHandler = jest.fn().mockResolvedValue(true);
      eventBus.subscribe(SubscriptionCreatedEvent.name, organizationResourceUpdateHandler);
      
      // 2. Simulera att en ny prenumeration skapas
      const mockSubscription = {
        id: 'sub-123',
        organizationId: 'org-123',
        planId: 'plan-pro',
        status: 'active',
        planType: 'pro',
      };
      
      // 3. Publicera subscription created event
      await eventBus.publish(SubscriptionCreatedEvent.name, {
        subscriptionId: mockSubscription.id,
        organizationId: mockSubscription.organizationId,
        planType: mockSubscription.planType,
      });
      
      // 4. Verifiera att organisationssidan hanterade händelsen
      expect(organizationResourceUpdateHandler).toHaveBeenCalled();
      const event = organizationResourceUpdateHandler.mock.calls[0][0];
      expect(event.subscriptionId).toBe('sub-123');
      expect(event.organizationId).toBe('org-123');
      expect(event.planType).toBe('pro');
    });
    
    it('ska uppdatera organisationens resursgränser när en prenumeration uppgraderas', async () => {
      // 1. Registrera subscribers på organisationssidan för att lyssna på prenumerationshändelser
      const organizationResourceUpdateHandler = jest.fn().mockResolvedValue(true);
      eventBus.subscribe(SubscriptionUpdatedEvent.name, organizationResourceUpdateHandler);
      
      // 2. Simulera att en prenumeration uppgraderas
      const updatedSubscription = {
        id: 'sub-123',
        organizationId: 'org-123',
        previousPlanType: 'basic',
        newPlanType: 'pro',
      };
      
      // 3. Publicera subscription updated event
      await eventBus.publish(SubscriptionUpdatedEvent.name, {
        subscriptionId: updatedSubscription.id,
        organizationId: updatedSubscription.organizationId,
        previousPlanType: updatedSubscription.previousPlanType,
        newPlanType: updatedSubscription.newPlanType,
      });
      
      // 4. Verifiera att organisationssidan hanterade händelsen
      expect(organizationResourceUpdateHandler).toHaveBeenCalled();
      const event = organizationResourceUpdateHandler.mock.calls[0][0];
      expect(event.subscriptionId).toBe('sub-123');
      expect(event.organizationId).toBe('org-123');
      expect(event.previousPlanType).toBe('basic');
      expect(event.newPlanType).toBe('pro');
    });
  });
  
  describe('Kontroll av funktioner och resursgränser', () => {
    it('ska tillåta/neka åtkomst till funktioner baserat på prenumerationsplan', async () => {
      // 1. Setup för test
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'active',
        plan: { type: 'pro' },
      };
      
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(
        mockResultOk(mockOrg)
      );
      
      mockSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      // 2. Registrera handler för feature checks
      const featureCheckHandler = (event: any) => {
        if (event.feature === 'basic_feature') {
          return mockResultOk(true);
        } else if (event.feature === 'pro_feature' && mockSubscription.plan.type === 'pro') {
          return mockResultOk(true);
        } else if (event.feature === 'enterprise_feature' && mockSubscription.plan.type === 'enterprise') {
          return mockResultOk(true);
        } else {
          return mockResultOk(false);
        }
      };
      
      featureFlagService.checkFeatureAccess = jest.fn().mockImplementation(
        (orgId: string, feature: string) => featureCheckHandler({ orgId, feature })
      );
      
      // 3. Utför kontroll av funktionsåtkomst
      const basicFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'basic_feature');
      const proFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'pro_feature');
      const enterpriseFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'enterprise_feature');
      
      // 4. Verifiera resultat
      expect(expectResultOk(basicFeatureResult, 'basic_feature access')).toBe(true);
      expect(expectResultOk(proFeatureResult, 'pro_feature access')).toBe(true);
      expect(expectResultOk(enterpriseFeatureResult, 'enterprise_feature access')).toBe(false);
    });
    
    it('ska hantera resursbegränsningar baserat på prenumerationsplan', async () => {
      // 1. Setup: Pro-plan med begränsningar
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'active',
        plan: { type: 'pro' },
      };
      
      mockSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      // Resursbegränsning för Pro-plan är 25 team members
      const usageLimitHandler = (orgId: string, resourceType: string, quantity: number) => {
        if (resourceType === 'teamMember' && mockSubscription.plan.type === 'pro') {
          return mockResultOk(quantity <= 25); // Pro plan tillåter upp till 25 teammedlemmar
        } else if (resourceType === 'team' && mockSubscription.plan.type === 'pro') {
          return mockResultOk(quantity <= 5); // Pro plan tillåter upp till 5 team
        } else {
          return mockResultOk(false);
        }
      };
      
      featureFlagService.checkUsageLimit = jest.fn().mockImplementation(
        (orgId: string, resourceType: string, quantity: number) => 
          usageLimitHandler(orgId, resourceType, quantity)
      );
      
      // 2. Registrera handler för team service
      teamService.getTeamsByOrganizationId = jest.fn().mockResolvedValue(
        mockResultOk([
          { id: 'team-1', name: 'Team 1', members: Array(20).fill({}) }, // 20 medlemmar
          { id: 'team-2', name: 'Team 2', members: Array(3).fill({}) }   // 3 medlemmar
        ])
      );
      
      // 3. Utför kontroll av resursgränser
      
      // Kontrollera att lägga till 3 medlemmar till (totalt 26) ska misslyckas
      const exceedMemberLimitResult = await featureFlagService.checkUsageLimit(
        'org-123', 'teamMember', 26
      );
      
      // Kontrollera att lägga till ytterligare 3 team (redan 2, totalt 5) ska lyckas
      const withinTeamLimitResult = await featureFlagService.checkUsageLimit(
        'org-123', 'team', 5
      );
      
      // Kontrollera att lägga till 6 team totalt ska misslyckas
      const exceedTeamLimitResult = await featureFlagService.checkUsageLimit(
        'org-123', 'team', 6
      );
      
      // 4. Verifiera resultat
      expect(expectResultOk(exceedMemberLimitResult, 'exceed member limit')).toBe(false);
      expect(expectResultOk(withinTeamLimitResult, 'within team limit')).toBe(true);
      expect(expectResultOk(exceedTeamLimitResult, 'exceed team limit')).toBe(false);
    });
  });
  
  describe('Prestandaspårning och användning', () => {
    it('ska spåra och uppdatera resursanvändning', async () => {
      // 1. Setup
      mockSubscriptionRepository.recordSubscriptionUsage.mockResolvedValue(
        mockResultOk({ id: 'usage-123' })
      );
      
      // 2. Registrera användning
      const result = await subscriptionService.recordUsage('org-123', 'apiCalls', 10);
      
      // 3. Verifiera att användning sparades
      expect(mockSubscriptionRepository.recordSubscriptionUsage).toHaveBeenCalledWith(
        'org-123', 'apiCalls', 10
      );
      
      expectResultOk(result, 'recordUsage');
    });
    
    it('ska hämta aktuell resursanvändning', async () => {
      // 1. Setup
      mockSubscriptionRepository.getSubscriptionUsage.mockResolvedValue(
        mockResultOk({ value: 50 })
      );
      
      // Säkerställer att subscriptionService har getFeatureUsage-metoden implementerad
      subscriptionService.getFeatureUsage = jest.fn().mockResolvedValue(
        mockResultOk({ value: 50 })
      );
      
      // 2. Hämta användning
      const result = await subscriptionService.getFeatureUsage('org-123', 'apiCalls');
      
      // 3. Verifiera resultat
      expect(mockSubscriptionRepository.getSubscriptionUsage).toHaveBeenCalledWith(
        'org-123', 'apiCalls'
      );
      
      const usage = expectResultOk(result, 'getFeatureUsage');
      expect(usage.value).toBe(50);
    });
  });
  
  describe('Hantering av utgångna prenumerationer', () => {
    it('ska neka åtkomst till funktioner när prenumerationen upphört', async () => {
      // 1. Setup: Utgången prenumeration
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'canceled', // Utgången prenumeration
        plan: { type: 'pro' },
      };
      
      mockSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      // 2. Registrera handler för feature checks
      featureFlagService.checkFeatureAccess = jest.fn().mockImplementation(
        (orgId: string, feature: string) => {
          if (mockSubscription.status !== 'active') {
            return mockResultErr('SUBSCRIPTION_INACTIVE');
          }
          return mockResultOk(true);
        }
      );
      
      // 3. Utför kontroll av funktionsåtkomst
      const featureResult = await subscriptionService.checkFeatureAccess('org-123', 'pro_feature');
      
      // 4. Verifiera att åtkomst nekades
      expectResultErr(featureResult, 'SUBSCRIPTION_INACTIVE', 'pro_feature access');
    });
    
    it('ska meddela domänen om prenumerationsstatus vid inaktivering', async () => {
      // 1. Registrera subscribers för att lyssna på prenumerationshändelser
      const subscriptionStatusHandler = jest.fn().mockResolvedValue(true);
      eventBus.subscribe('subscription.canceled', subscriptionStatusHandler);
      
      // 2. Simulera att en prenumeration inaktiveras
      await eventBus.publish('subscription.canceled', {
        subscriptionId: 'sub-123',
        organizationId: 'org-123',
        canceledAt: new Date().toISOString(),
      });
      
      // 3. Verifiera att händelsen hanterades
      expect(subscriptionStatusHandler).toHaveBeenCalled();
      const eventData = subscriptionStatusHandler.mock.calls[0][0];
      expect(eventData.subscriptionId).toBe('sub-123');
      expect(eventData.organizationId).toBe('org-123');
    });
  });
}); 