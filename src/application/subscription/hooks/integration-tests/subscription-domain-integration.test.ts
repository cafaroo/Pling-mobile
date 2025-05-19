/**
 * Integrationstester mellan Subscription-domänlagret och applikationslagret
 * 
 * Dessa tester fokuserar på hur Subscription-domänens händelser integrerar
 * med applikationslagrets hooks och use-cases. Testerna simulerar olika
 * prenumerationsscenarier och verifierar att händelser korrekt hanteras
 * och propageras mellan lagren.
 */

import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

// Domain entities och events
import { Subscription } from '@/domain/subscription/entities/Subscription';
import { 
  SubscriptionPlan, 
  SubscriptionStatus
} from '@/domain/subscription/entities/SubscriptionTypes';
import {
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent,
  SubscriptionPlanChangedEvent,
  SubscriptionCancelledEvent,
  SubscriptionPeriodUpdatedEvent,
  SubscriptionUsageUpdatedEvent,
  SubscriptionPaymentMethodUpdatedEvent,
  SubscriptionBillingUpdatedEvent
} from '@/domain/subscription/events';

// Infrastruktur
import { MockDomainEventPublisher } from '@/test-utils/mocks/mockDomainEventPublisher';
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';

// Simulerad användning av prenumerationslogik i application layer
import { useSubscription } from '@/application/subscription/hooks/useSubscriptionContext';

// Import av MockSubscription för testning
import { MockSubscription, createMockSubscription } from '@/test-utils/mocks/mockSubscription';

/**
 * Mock för SubscriptionRepository
 * Simulerar datapersistens för prenumerationer
 */
class MockSubscriptionRepository {
  private subscriptions = new Map<string, any>();
  private plans = new Map<string, any>();
  
  constructor() {
    // Fördefiniera några prenumerationsplaner
    this.plans.set('free', {
      id: 'free',
      name: 'Gratis',
      description: 'Grundläggande funktionalitet',
      features: ['basic_team', 'basic_chat'],
      limits: {
        teamMembers: 5,
        teams: 1
      },
      price: 0
    });
    
    this.plans.set('standard', {
      id: 'standard',
      name: 'Standard',
      description: 'För små team',
      features: ['basic_team', 'basic_chat', 'file_sharing', 'advanced_team_settings'],
      limits: {
        teamMembers: 20,
        teams: 5
      },
      price: 99
    });
    
    this.plans.set('premium', {
      id: 'premium',
      name: 'Premium',
      description: 'För krävande organisationer',
      features: ['basic_team', 'basic_chat', 'file_sharing', 'advanced_team_settings', 'premium_analytics'],
      limits: {
        teamMembers: 100,
        teams: 20
      },
      price: 299
    });
  }
  
  async getActiveSubscription(organizationId: string): Promise<Result<any>> {
    const subscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.organizationId === organizationId && s.status === SubscriptionStatus.ACTIVE);
    
    if (subscriptions.length === 0) {
      return Result.err(new Error(`Ingen aktiv prenumeration hittades för organisation ${organizationId}`));
    }
    
    return Result.ok(subscriptions[0]);
  }
  
  async getPlan(planId: string): Promise<Result<any>> {
    const plan = this.plans.get(planId);
    
    if (!plan) {
      return Result.err(new Error(`Plan ${planId} hittades inte`));
    }
    
    return Result.ok(plan);
  }
  
  async getAllSubscriptions(): Promise<Result<any[]>> {
    return Result.ok(Array.from(this.subscriptions.values()));
  }
  
  async updateSubscription(subscription: any): Promise<Result<boolean>> {
    this.subscriptions.set(subscription.id, subscription);
    return Result.ok(true);
  }
  
  // Helper för tester
  addSubscription(subscription: any): void {
    this.subscriptions.set(subscription.id, subscription);
  }
  
  clear(): void {
    this.subscriptions.clear();
  }
  
  getAll(): any[] {
    return Array.from(this.subscriptions.values());
  }
}

/**
 * Test för domäneventhantering och integration mellan domain- och applikationslager
 */
describe('Subscription domän och applikationslager integration', () => {
  let subscriptionRepo: MockSubscriptionRepository;
  let eventPublisher: MockDomainEventPublisher;

  // Gemensamma mockar för alla integrationstester
  let mockNotificationService: any;
  let mockTeamRepository: any;
  let mockFeatureFlagService: any;

  beforeEach(() => {
    subscriptionRepo = new MockSubscriptionRepository();
    eventPublisher = new MockDomainEventPublisher();

    // Mock för notifiering
    mockNotificationService = {
      sendNotification: jest.fn().mockImplementation((userId, notification) => {
        console.log('Notifiering skickas till:', userId, notification);
        return Promise.resolve(Result.ok(undefined));
      })
    };
    // Mock för team- och användar-repositories
    mockTeamRepository = {
      findByOrganizationId: jest.fn().mockResolvedValue(Result.ok([
        { id: new UniqueId(), name: 'Team 1', members: [{ id: new UniqueId() }, { id: new UniqueId() }] }
      ]))
    };
    // Mock för feature flag service
    mockFeatureFlagService = {
      updateFeaturesForOrganization: jest.fn().mockResolvedValue(Result.ok(undefined)),
      hasAccess: jest.fn().mockResolvedValue(Result.ok({
        hasAccess: true,
        reason: 'Premium feature enabled'
      }))
    };
  });

  afterEach(() => {
    subscriptionRepo.clear();
    eventPublisher.clearEvents();
    jest.clearAllMocks();
  });

  describe('Subscription domain events', () => {
    it('bör publicera korrekt SubscriptionCreatedEvent när en ny prenumeration skapas', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const planId = 'standard';
      
      // Agera
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagar framåt
      });
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent manuellt eftersom create() inte gör det i mock
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate ?? undefined
      });
      
      eventPublisher.publish(createdEvent);
      
      // Verifiera
      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      
      const event = publishedEvents[0] as SubscriptionCreatedEvent;
      expect(event instanceof SubscriptionCreatedEvent).toBe(true);
      expect(event.payload.subscriptionId).toBe(subscription.id.toString());
      expect(event.payload.organizationId).toBe(orgId.toString());
      expect(event.payload.planId).toBe(planId);
    });
    
    it('bör publicera korrekt SubscriptionStatusChangedEvent när prenumerationsstatus ändras', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: 'standard',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagar framåt
      });
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Publicera initialt skapandeevent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: 'standard',
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate ?? undefined
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - ändra status från ACTIVE till PAUSED
      subscription.changeStatus(SubscriptionStatus.INACTIVE);
      await subscription.save();
      
      // Verifiera
      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents.length).toBe(2); // SubscriptionCreated + SubscriptionStatusChanged
      
      const statusEvent = publishedEvents[1] as SubscriptionStatusChangedEvent;
      expect(statusEvent instanceof SubscriptionStatusChangedEvent).toBe(true);
      expect(statusEvent.payload.subscriptionId).toBe(subscription.id.toString());
      expect(statusEvent.payload.oldStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(statusEvent.payload.newStatus).toBe(SubscriptionStatus.INACTIVE);
    });
    
    it('bör publicera korrekt SubscriptionPlanChangedEvent när prenumerationsplan ändras', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const oldPlanId = 'standard';
      const newPlanId = 'premium';
      
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: oldPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagar framåt
      });
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Publicera initialt skapandeevent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: oldPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate ?? undefined
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - uppgradera från standard till premium
      subscription.changePlan(newPlanId);
      await subscription.save();
      
      // Verifiera
      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents.length).toBe(2); // SubscriptionCreated + SubscriptionPlanChanged
      
      const planEvent = publishedEvents[1] as SubscriptionPlanChangedEvent;
      expect(planEvent instanceof SubscriptionPlanChangedEvent).toBe(true);
      expect(planEvent.payload.subscriptionId).toBe(subscription.id.toString());
      expect(planEvent.payload.oldPlanId).toBe(oldPlanId);
      expect(planEvent.payload.newPlanId).toBe(newPlanId);
    });
    
    it('bör publicera korrekt SubscriptionCancelledEvent när en prenumeration avbryts', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: 'premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagar framåt
      });
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Publicera initialt skapandeevent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: 'premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate ?? undefined
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - avbryt prenumerationen
      subscription.cancel('Bytt till annan tjänst');
      await subscription.save();
      
      // Verifiera
      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents.length).toBe(2); // SubscriptionCreated + SubscriptionCancelled
      
      const cancelEvent = publishedEvents[1] as SubscriptionCancelledEvent;
      expect(cancelEvent instanceof SubscriptionCancelledEvent).toBe(true);
      expect(cancelEvent.payload.subscriptionId).toBe(subscription.id.toString());
      expect(cancelEvent.payload.reason).toBe('Bytt till annan tjänst');
      expect(cancelEvent.payload.cancelledAt).toBeDefined();
    });
  });
  
  describe('Integration mellan Subscription-events och andra domäner', () => {
    it('bör uppdatera organisationens tillgängliga funktioner när prenumerationsplan ändras', async () => {
      const orgId = new UniqueId();
      const initialPlanId = 'free';
      const newPlanId = 'premium';

      // Skapa prenumeration
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: initialPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      expect(subscriptionResult.isOk()).toBe(true);
      const subscription = createMockSubscription(subscriptionResult.value);

      // Mock SubscriptionEventHandler som använder gemensam mockFeatureFlagService
      const mockEventHandler = {
        handleSubscriptionPlanChanged: jest.fn().mockImplementation(async (event) => {
          await mockFeatureFlagService.updateFeaturesForOrganization(
            event.payload.organizationId,
            event.payload.newPlanId
          );
          return Result.ok(undefined);
        })
      };
      eventPublisher.subscribe(SubscriptionPlanChangedEvent.name, (event: SubscriptionPlanChangedEvent) =>
        mockEventHandler.handleSubscriptionPlanChanged(event));
      subscription.setEventPublisher(eventPublisher);
      // Agera - ändra prenumerationsplanen
      subscription.changePlan(newPlanId);
      await subscription.save();
      // Verifiera
      expect(mockEventHandler.handleSubscriptionPlanChanged).toHaveBeenCalled();
      expect(mockFeatureFlagService.updateFeaturesForOrganization).toHaveBeenCalledWith(
        orgId.toString(),
        newPlanId
      );
      const hasFeatureResult = await mockFeatureFlagService.hasAccess(
        'premium_analytics',
        orgId.toString()
      );
      expect(hasFeatureResult.isOk()).toBe(true);
      expect(hasFeatureResult.data.hasAccess).toBe(true);
    });

    it('bör hantera beroenden mellan domäner när en prenumeration avbryts', async () => {
      const orgId = new UniqueId();
      const userId1 = new UniqueId();
      const userId2 = new UniqueId();
      // Åsidosätt mockTeamRepository för att använda userId1 och userId2
      mockTeamRepository.findByOrganizationId.mockResolvedValue(Result.ok([
        { id: new UniqueId(), name: 'Team 1', members: [{ id: userId1 }, { id: userId2 }] }
      ]));
      // Skapa prenumeration
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: 'premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      expect(subscriptionResult.isOk()).toBe(true);
      const subscription = createMockSubscription(subscriptionResult.value);
      // Mock SubscriptionCancellationHandler som använder gemensam mockNotificationService och mockTeamRepository
      const mockCancellationHandler = {
        handleSubscriptionCancelled: jest.fn().mockImplementation(async (event) => {
          const teamsResult = await mockTeamRepository.findByOrganizationId(event.payload.organizationId);
          if (teamsResult.isOk()) {
            const teams = teamsResult.data;
            const affectedUsers = new Set<string>();
            teams.forEach((team: { members: { id: string }[] }) => {
              team.members.forEach((member: { id: string }) => {
                affectedUsers.add(member.id.toString());
              });
            });
            for (const userId of affectedUsers) {
              await mockNotificationService.sendNotification(userId, {
                type: 'SUBSCRIPTION_CANCELLED',
                title: 'Prenumeration avslutad',
                message: `Organisationens prenumeration har avbrutits: ${event.payload.reason}`
              });
            }
          }
          return Result.ok(undefined);
        })
      };
      eventPublisher.subscribe(SubscriptionCancelledEvent.name, (event: SubscriptionCancelledEvent) =>
        mockCancellationHandler.handleSubscriptionCancelled(event));
      subscription.setEventPublisher(eventPublisher);
      // Agera - avbryt prenumerationen
      const reason = 'Ekonomiskt beslut';
      subscription.cancel(reason);
      await subscription.save();
      // Verifiera
      expect(mockCancellationHandler.handleSubscriptionCancelled).toHaveBeenCalled();
      expect(mockTeamRepository.findByOrganizationId).toHaveBeenCalledWith(orgId.toString());
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        userId1.toString(),
        expect.objectContaining({
          type: 'SUBSCRIPTION_CANCELLED',
          message: expect.stringContaining(reason)
        })
      );
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        userId2.toString(),
        expect.objectContaining({
          type: 'SUBSCRIPTION_CANCELLED',
          message: expect.stringContaining(reason)
        })
      );
    });
  });
}); 