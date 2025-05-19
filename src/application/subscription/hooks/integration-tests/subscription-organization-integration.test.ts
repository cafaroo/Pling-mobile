/**
 * Integrationstester mellan Subscription- och Organization-domänerna
 * 
 * Dessa tester fokuserar på hur Subscription-domänens händelser påverkar
 * Organization-domänen. Testerna simulerar olika prenumerationsscenarier
 * och verifierar att Organisation-entiteter uppdateras korrekt baserat på
 * prenumerationsändringar.
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
  SubscriptionCancelledEvent
} from '@/domain/subscription/events';

import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationType } from '@/domain/organization/entities/OrganizationType';

// Repositories
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';

// Event hantering
import { MockDomainEventPublisher } from '@/test-utils/mocks/mockDomainEventPublisher';
import { DomainEventPublisher } from '@/shared/domain/events/DomainEventPublisher';

// Event handlers
import { SubscriptionEventHandler } from '@/domain/organization/adapters/SubscriptionEventHandler';

// Import av MockSubscription för testning
import { MockSubscription, createMockSubscription } from '@/test-utils/mocks/mockSubscription';

/**
 * Mock för SubscriptionRepository
 */
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions = new Map<string, any>();
  private plans = new Map<string, any>();
  
  constructor() {
    // Standardplaner
    this.plans.set('free', {
      id: 'free',
      name: 'Gratis',
      features: ['basic_team'],
      limits: { teamMembers: 5, teams: 1 }
    });
    
    this.plans.set('standard', {
      id: 'standard',
      name: 'Standard',
      features: ['basic_team', 'file_sharing'],
      limits: { teamMembers: 20, teams: 5 }
    });
    
    this.plans.set('premium', {
      id: 'premium',
      name: 'Premium',
      features: ['basic_team', 'file_sharing', 'premium_analytics'],
      limits: { teamMembers: 100, teams: 20 }
    });
  }
  
  async getActiveSubscription(organizationId: string): Promise<Result<any>> {
    const subscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.organizationId === organizationId && s.status === SubscriptionStatus.ACTIVE);
    
    if (subscriptions.length === 0) {
      return Result.err(new Error(`Ingen aktiv prenumeration för org ${organizationId}`));
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
    this.subscriptions.set(subscription.id.toString(), subscription);
    return Result.ok(true);
  }
  
  // Helper-metoder för tester
  addSubscription(subscription: any): void {
    this.subscriptions.set(subscription.id.toString(), subscription);
  }
  
  clear(): void {
    this.subscriptions.clear();
  }
}

/**
 * Mock för OrganizationRepository
 */
class MockOrganizationRepository implements OrganizationRepository {
  private organizations = new Map<string, Organization>();
  
  async findById(id: string | UniqueId): Promise<Result<Organization>> {
    const idStr = id instanceof UniqueId ? id.toString() : id;
    
    if (!this.organizations.has(idStr)) {
      return Result.err(new Error(`Organisation ${idStr} hittades inte`));
    }
    
    return Result.ok(this.organizations.get(idStr)!);
  }
  
  async save(organization: Organization): Promise<Result<void>> {
    this.organizations.set(organization.id.toString(), organization);
    return Result.ok(undefined);
  }
  
  async findByName(name: string): Promise<Result<Organization>> {
    for (const org of this.organizations.values()) {
      if (org.name === name) {
        return Result.ok(org);
      }
    }
    
    return Result.err(new Error(`Organisation med namn ${name} hittades inte`));
  }
  
  async findAll(): Promise<Result<Organization[]>> {
    return Result.ok(Array.from(this.organizations.values()));
  }
  
  // Helper-metoder för tester
  addOrganization(organization: Organization): void {
    this.organizations.set(organization.id.toString(), organization);
  }
  
  clear(): void {
    this.organizations.clear();
  }
  
  getById(id: string): Organization | undefined {
    return this.organizations.get(id);
  }
}

describe('Subscription och Organization integration', () => {
  let subscriptionRepo: MockSubscriptionRepository;
  let organizationRepo: MockOrganizationRepository;
  let eventPublisher: MockDomainEventPublisher;
  let subscriptionEventHandler: SubscriptionEventHandler;
  
  beforeEach(() => {
    subscriptionRepo = new MockSubscriptionRepository();
    organizationRepo = new MockOrganizationRepository();
    eventPublisher = new MockDomainEventPublisher();
    
    // Skapa subscription event handler som lyssnar på prenumerationshändelser
    subscriptionEventHandler = new SubscriptionEventHandler(organizationRepo);
    
    // Registrera händelsehanteraren med event publishern
    eventPublisher.subscribe(SubscriptionCreatedEvent.name, (event) => 
      subscriptionEventHandler.handleSubscriptionCreated(event as SubscriptionCreatedEvent));
    
    eventPublisher.subscribe(SubscriptionStatusChangedEvent.name, (event) => 
      subscriptionEventHandler.handleSubscriptionStatusChanged(event as SubscriptionStatusChangedEvent));
    
    eventPublisher.subscribe(SubscriptionPlanChangedEvent.name, (event) => 
      subscriptionEventHandler.handleSubscriptionPlanChanged(event as SubscriptionPlanChangedEvent));
    
    eventPublisher.subscribe(SubscriptionCancelledEvent.name, (event) => 
      subscriptionEventHandler.handleSubscriptionCancelled(event as SubscriptionCancelledEvent));
  });
  
  afterEach(() => {
    subscriptionRepo.clear();
    organizationRepo.clear();
    eventPublisher.clearEvents();
  });
  
  describe('Subscription events påverkar Organization', () => {
    it('bör uppdatera organisationens planId när en ny prenumeration skapas', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const planId = 'standard';
      
      // Skapa organisation
      const orgResult = Organization.create({
        name: 'TestOrg AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId: 'free' // Börjar med gratisplanen
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      organization.setEventPublisher(eventPublisher);
      
      // Spara organization i repo
      await organizationRepo.save(organization);
      
      // Skapa subscription
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      // Agera - utlös SubscriptionCreatedEvent
      eventPublisher.publish(createdEvent);
      
      // Verifiera
      const updatedOrg = organizationRepo.getById(orgId.toString());
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg!.planId).toBe(planId);
    });
    
    it('bör uppdatera organisationens status när prenumerationsstatusen ändras', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const planId = 'premium';
      
      // Skapa organisation med aktiv plan
      const orgResult = Organization.create({
        name: 'Enterprise AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      organization.setEventPublisher(eventPublisher);
      await organizationRepo.save(organization);
      
      // Skapa aktiv prenumeration
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - pausa prenumerationen
      subscription.changeStatus(SubscriptionStatus.PAUSED);
      await subscription.save();
      
      // Verifiera
      const updatedOrg = organizationRepo.getById(orgId.toString());
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg!.status).toBe('PAUSED'); // Förväntar att Organisation har motsvarande statusfält
    });
    
    it('bör uppdatera organisationens plan när prenumerationsplanen ändras', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const initialPlanId = 'standard';
      const newPlanId = 'premium';
      
      // Skapa organisation med standardplan
      const orgResult = Organization.create({
        name: 'Growing Company AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId: initialPlanId
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      organization.setEventPublisher(eventPublisher);
      await organizationRepo.save(organization);
      
      // Skapa aktiv prenumeration med standardplan
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: initialPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: initialPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - uppgradera till premium
      subscription.changePlan(newPlanId);
      await subscription.save();
      
      // Verifiera
      const updatedOrg = organizationRepo.getById(orgId.toString());
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg!.planId).toBe(newPlanId);
    });
    
    it('bör markera organisationen som inaktiv när prenumerationen avbryts', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const planId = 'premium';
      
      // Skapa organisation med premiumplan
      const orgResult = Organization.create({
        name: 'Leaving Company AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      organization.setEventPublisher(eventPublisher);
      await organizationRepo.save(organization);
      
      // Skapa aktiv prenumeration
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Agera - avbryt prenumerationen
      subscription.cancel('Bytt till konkurrent');
      await subscription.save();
      
      // Verifiera
      const updatedOrg = organizationRepo.getById(orgId.toString());
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg!.status).toBe('INACTIVE');
      expect(updatedOrg!.planId).toBe('free'); // Bör återgå till gratisplan
    });
  });
  
  describe('Cross-domain domänlogik', () => {
    it('bör tillåta eller begränsa funktionstillgång baserat på prenumerationsplanen', async () => {
      // Arrangera
      const orgId = new UniqueId();
      
      // Skapa organisation med gratisplan
      const orgResult = Organization.create({
        name: 'Feature Test AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId: 'free'
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      await organizationRepo.save(organization);
      
      // Hämta funktionsflaggor för gratisplanen
      let hasAdvancedFeatures = await organization.hasAccess('advanced_team_settings');
      expect(hasAdvancedFeatures).toBe(false);
      
      // Agera - uppgradera till premium via prenumerationsändring
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: 'premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: 'premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Verifiera - nu bör avancerade funktioner vara tillgängliga
      const updatedOrg = await organizationRepo.findById(orgId);
      expect(updatedOrg.isOk()).toBe(true);
      
      hasAdvancedFeatures = await updatedOrg.value.hasAccess('advanced_team_settings');
      expect(hasAdvancedFeatures).toBe(true);
    });
    
    it('bör hantera lagring av prenumerationshistorik i organisationsentiteten', async () => {
      // Arrangera
      const orgId = new UniqueId();
      
      // Skapa organisation
      const orgResult = Organization.create({
        name: 'History Test AB',
        type: OrganizationType.COMPANY,
        ownerId: new UniqueId().toString(),
        planId: 'free'
      }, orgId);
      
      expect(orgResult.isOk()).toBe(true);
      const organization = orgResult.value;
      organization.setEventPublisher(eventPublisher);
      await organizationRepo.save(organization);
      
      // Agera - skapa och ändra prenumerationsplaner i sekvens
      // 1. Skapa en gratisprenumeration
      const freeSubResult = Subscription.create({
        organizationId: orgId,
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 dagar sedan
        endDate: null
      }, new UniqueId());
      
      expect(freeSubResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const freeSub = createMockSubscription(freeSubResult.value);
      freeSub.setEventPublisher(eventPublisher);
      
      // Skapa och publicera initial SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: freeSub.id.toString(),
        organizationId: orgId.toString(),
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: freeSub.startDate,
        endDate: freeSub.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // 2. Uppgradera till standard
      freeSub.changePlan('standard');
      await freeSub.save();
      
      // 3. Uppgradera till premium
      freeSub.changePlan('premium');
      await freeSub.save();
      
      // 4. Avbryt prenumerationen
      freeSub.cancel('Testavslut');
      await freeSub.save();
      
      // Verifiera
      const updatedOrg = organizationRepo.getById(orgId.toString());
      expect(updatedOrg).toBeDefined();
      
      // Kontrollera prenumerationshistoriken
      const history = updatedOrg!.getSubscriptionHistory();
      expect(history).toBeDefined();
      expect(history.length).toBe(4); // 4 ändringar
      
      // Kontrollera att historiken innehåller rätt planändringar
      expect(history[0].planId).toBe('free');
      expect(history[1].planId).toBe('standard');
      expect(history[2].planId).toBe('premium');
      expect(history[3].planId).toBe('free'); // Återgång till gratis vid avbrytande
    });
  });
}); 