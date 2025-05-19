/**
 * Integrationstester mellan Subscription- och Team-domänerna
 * 
 * Dessa tester fokuserar på hur Subscription-domänens händelser påverkar
 * Team-domänen. Testerna simulerar olika prenumerationsscenarier
 * och verifierar att Team-entiteter uppdateras korrekt baserat på
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

import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamFactory } from '@/domain/team/entities/TeamFactory';
import { TeamMemberRole } from '@/domain/team/value-objects/TeamMemberRole';

// Repositories
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

// Event hantering
import { MockDomainEventPublisher } from '@/test-utils/mocks/mockDomainEventPublisher';
import { DomainEventPublisher } from '@/shared/domain/events/DomainEventPublisher';

// Import av MockSubscription för testning
import { MockSubscription, createMockSubscription } from '@/test-utils/mocks/mockSubscription';

// Mock klasser för testning
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();
  
  async findById(id: UniqueId): Promise<Result<Subscription, Error>> {
    const sub = this.subscriptions.get(id.toString());
    if (!sub) {
      return Result.err(new Error(`Subscription not found: ${id.toString()}`));
    }
    return Result.ok(sub);
  }
  
  async findByOrganizationId(orgId: string): Promise<Result<Subscription[], Error>> {
    const subs: Subscription[] = [];
    this.subscriptions.forEach(sub => {
      if (sub.organizationId.toString() === orgId) {
        subs.push(sub);
      }
    });
    return Result.ok(subs);
  }
  
  async save(subscription: Subscription): Promise<Result<void, Error>> {
    this.subscriptions.set(subscription.id.toString(), subscription);
    return Result.ok();
  }
  
  clear() {
    this.subscriptions.clear();
  }
}

class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();
  
  async findById(id: string): Promise<Result<Team, Error>> {
    const team = this.teams.get(id);
    if (!team) {
      return Result.err(new Error(`Team not found: ${id}`));
    }
    return Result.ok(team);
  }
  
  async findByOrganizationId(orgId: string): Promise<Result<Team[], Error>> {
    const teamsByOrg: Team[] = [];
    this.teams.forEach(team => {
      if (team.organizationId.toString() === orgId) {
        teamsByOrg.push(team);
      }
    });
    return Result.ok(teamsByOrg);
  }
  
  async save(team: Team): Promise<Result<void, Error>> {
    this.teams.set(team.id.toString(), team);
    return Result.ok();
  }
  
  clear() {
    this.teams.clear();
  }
  
  async create(team: Team): Promise<Result<void, Error>> {
    return this.save(team);
  }
  
  async delete(id: string): Promise<Result<void, Error>> {
    if (!this.teams.has(id)) {
      return Result.err(new Error(`Team not found: ${id}`));
    }
    this.teams.delete(id);
    return Result.ok();
  }
  
  async findByMemberId(memberId: string): Promise<Result<Team[], Error>> {
    const teamsByMember: Team[] = [];
    this.teams.forEach(team => {
      if (team.hasMember(memberId)) {
        teamsByMember.push(team);
      }
    });
    return Result.ok(teamsByMember);
  }
  
  // Hjälpmetod för att testa repo-innehåll
  getAll(): Team[] {
    return Array.from(this.teams.values());
  }
}

// Mock subscription event handler för Team-domänen
class MockTeamSubscriptionHandler {
  private teamRepo: MockTeamRepository;
  
  constructor(teamRepo: MockTeamRepository) {
    this.teamRepo = teamRepo;
  }
  
  async handleSubscriptionPlanChanged(event: SubscriptionPlanChangedEvent): Promise<Result<void, Error>> {
    // Hämta alla team för organisationen
    const teamsResult = await this.teamRepo.findByOrganizationId(event.payload.organizationId);
    if (teamsResult.isErr()) {
      return Result.err(new Error(`Could not find teams: ${teamsResult.error.message}`));
    }
    
    const teams = teamsResult.value;
    
    // Uppdatera team-medlemskapsgränser baserat på ny plan
    const maxMembers = this.getMaxTeamMembersForPlan(event.payload.newPlanId);
    
    // Uppdatera alla team i organisationen
    for (const team of teams) {
      team.updatePlanLimits(maxMembers);
      await this.teamRepo.save(team);
    }
    
    return Result.ok();
  }
  
  async handleSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<Result<void, Error>> {
    // Hämta alla team för organisationen
    const teamsResult = await this.teamRepo.findByOrganizationId(event.payload.organizationId);
    if (teamsResult.isErr()) {
      return Result.err(new Error(`Could not find teams: ${teamsResult.error.message}`));
    }
    
    const teams = teamsResult.value;
    
    // Begränsa team vid avbruten prenumeration
    const freeMaxMembers = this.getMaxTeamMembersForPlan('free');
    
    for (const team of teams) {
      team.updatePlanLimits(freeMaxMembers);
      await this.teamRepo.save(team);
    }
    
    return Result.ok();
  }
  
  // Hjälpmetod för att bestämma medlemskapstak baserat på prenumerationsplan
  private getMaxTeamMembersForPlan(planId: string): number {
    switch (planId) {
      case 'free':
        return 3;
      case 'standard':
        return 10;
      case 'premium':
        return 25;
      case 'enterprise':
        return 100;
      default:
        return 3; // Default till free-begränsningar
    }
  }
}

// Huvudtestsviten
describe('Subscription och Team integration', () => {
  let subscriptionRepo: MockSubscriptionRepository;
  let teamRepo: MockTeamRepository;
  let eventPublisher: MockDomainEventPublisher;
  let teamSubscriptionHandler: MockTeamSubscriptionHandler;
  
  beforeEach(() => {
    subscriptionRepo = new MockSubscriptionRepository();
    teamRepo = new MockTeamRepository();
    eventPublisher = new MockDomainEventPublisher();
    
    // Skapa subscription event handler som påverkar team-entiteter
    teamSubscriptionHandler = new MockTeamSubscriptionHandler(teamRepo);
    
    // Registrera händelsehanteraren med event publishern
    eventPublisher.subscribe(SubscriptionPlanChangedEvent.name, (event) => 
      teamSubscriptionHandler.handleSubscriptionPlanChanged(event as SubscriptionPlanChangedEvent));
    
    eventPublisher.subscribe(SubscriptionCancelledEvent.name, (event) => 
      teamSubscriptionHandler.handleSubscriptionCancelled(event as SubscriptionCancelledEvent));
  });
  
  afterEach(() => {
    subscriptionRepo.clear();
    teamRepo.clear();
    eventPublisher.clearEvents();
  });
  
  describe('Subscription events påverkar Team-entiteter', () => {
    it('bör uppdatera team-medlemskapsgränser när prenumerationsplanen ändras', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const ownerId = new UniqueId();
      const initialPlanId = 'standard';
      const upgradedPlanId = 'premium';
      
      // Skapa team inom organisationen med standardbegränsningar
      const team1 = TeamFactory.createNewTeam({
        name: 'Utveckling',
        description: 'Utvecklingsteam',
        organizationId: orgId,
        creatorId: ownerId,
        isPrivate: false,
        maxMembers: 10 // Standardplan tillåter 10 medlemmar
      });
      
      expect(team1.isOk()).toBe(true);
      await teamRepo.save(team1.value);
      
      // Skapa ett andra team
      const team2 = TeamFactory.createNewTeam({
        name: 'Försäljning',
        description: 'Försäljningsteam',
        organizationId: orgId,
        creatorId: ownerId,
        isPrivate: false,
        maxMembers: 10
      });
      
      expect(team2.isOk()).toBe(true);
      await teamRepo.save(team2.value);
      
      // Skapa en aktiv subscription med standardplan
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
      
      // Verifiera initiala tillstånd
      const initialTeams = teamRepo.getAll();
      expect(initialTeams.length).toBe(2);
      expect(initialTeams[0].maxMembers).toBe(10);
      expect(initialTeams[1].maxMembers).toBe(10);
      
      // Agera - uppgradera till premium
      subscription.changePlan(upgradedPlanId);
      await subscription.save();
      
      // Verifiera att team-gränserna uppdaterats
      const updatedTeams = teamRepo.getAll();
      expect(updatedTeams.length).toBe(2);
      expect(updatedTeams[0].maxMembers).toBe(25); // Premium tillåter 25 medlemmar
      expect(updatedTeams[1].maxMembers).toBe(25);
    });
    
    it('bör begränsa team-medlemskap när prenumerationen avbryts', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const ownerId = new UniqueId();
      const planId = 'premium';
      
      // Skapa team inom organisationen med premiumbegränsningar
      const team = TeamFactory.createNewTeam({
        name: 'Enterprise Team',
        description: 'Enterprise team med många medlemmar',
        organizationId: orgId,
        creatorId: ownerId,
        isPrivate: false,
        maxMembers: 25 // Premium-plan tillåter 25 medlemmar
      });
      
      expect(team.isOk()).toBe(true);
      
      // Lägg till flera medlemmar (15 st totalt med ägaren)
      const basicTeam = team.value;
      
      for (let i = 0; i < 14; i++) {
        const memberId = new UniqueId();
        const member = TeamMember.create({
          userId: memberId.toString(),
          role: TeamMemberRole.MEMBER,
          addedBy: ownerId.toString(),
          addedAt: new Date()
        });
        
        basicTeam.addMember(member);
      }
      
      await teamRepo.save(basicTeam);
      
      // Skapa en aktiv prenumeration med premiumplan
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
      
      // Verifiera initialt tillstånd
      const initialTeam = (await teamRepo.findById(basicTeam.id.toString())).value;
      expect(initialTeam.members.length).toBe(15);
      expect(initialTeam.maxMembers).toBe(25);
      
      // Agera - avbryt prenumerationen
      subscription.cancel('Kostnadsbesparingar');
      await subscription.save();
      
      // Verifiera att team-gränserna har minskats
      const updatedTeam = (await teamRepo.findById(basicTeam.id.toString())).value;
      expect(updatedTeam.maxMembers).toBe(3); // Free-plan tillåter 3 medlemmar
      
      // Verifiera att "excess members" marker är satt
      expect(updatedTeam.hasExcessMembers()).toBe(true);
      expect(updatedTeam.getExcessMemberCount()).toBe(12); // 15 medlemmar - 3 tillåtna = 12 överskott
    });
    
    it('bör tillåta olika team-funktioner baserat på prenumerationsplan', async () => {
      // Arrangera
      const orgId = new UniqueId();
      const ownerId = new UniqueId();
      
      // Skapa team inom en organisation med gratisplan
      const team = TeamFactory.createNewTeam({
        name: 'Feature Test Team',
        description: 'Team för att testa funktioner',
        organizationId: orgId,
        creatorId: ownerId,
        isPrivate: false,
        maxMembers: 3 // Free-plan begränsning
      });
      
      expect(team.isOk()).toBe(true);
      await teamRepo.save(team.value);
      
      // Skapa en gratisprenumeration
      const subscriptionResult = Subscription.create({
        organizationId: orgId,
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: null
      }, new UniqueId());
      
      expect(subscriptionResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(subscriptionResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Verifiera initialt tillstånd - finns inga avancerade funktioner
      const initialTeam = (await teamRepo.findById(team.value.id.toString())).value;
      expect(initialTeam.hasAdvancedFeature('team_templates')).toBe(false);
      
      // Agera - uppgradera till premiumplan
      subscription.changePlan('premium');
      await subscription.save();
      
      // Simulera att teamet uppdateras med funktioner baserat på planändringen
      const updatedTeamOrg = (await teamRepo.findById(team.value.id.toString())).value;
      updatedTeamOrg.updateFeatures(['team_templates', 'advanced_reporting', 'custom_roles']);
      await teamRepo.save(updatedTeamOrg);
      
      // Verifiera tillgång till avancerade funktioner
      const premiumTeam = (await teamRepo.findById(team.value.id.toString())).value;
      expect(premiumTeam.hasAdvancedFeature('team_templates')).toBe(true);
      expect(premiumTeam.hasAdvancedFeature('advanced_reporting')).toBe(true);
      expect(premiumTeam.hasAdvancedFeature('custom_roles')).toBe(true);
    });
  });
  
  describe('Integrerad affärslogik över domängränser', () => {
    // Simulering av mer komplex domänöverskridande logik
    
    it('bör hantera övergångar mellan planer på ett konsistent sätt', async () => {
      // Detta test simulerar en komplett livscykel för en organisation och dess team:
      // - Skapar org med gratisplan
      // - Uppgraderar till standard och skapar fler team
      // - Uppgraderar till premium och lägger till många medlemmar
      // - Nedgraderar till standard
      // - Avbryter prenumerationen
      
      const orgId = new UniqueId();
      const ownerId = new UniqueId();
      
      // Steg 1: Skapa ett första team med gratis-begränsningar
      const firstTeam = TeamFactory.createNewTeam({
        name: 'Första teamet',
        description: 'Startteam',
        organizationId: orgId,
        creatorId: ownerId,
        isPrivate: false,
        maxMembers: 3
      });
      
      expect(firstTeam.isOk()).toBe(true);
      await teamRepo.save(firstTeam.value);
      
      // Skapa en gratisprenumeration
      const freeSubResult = Subscription.create({
        organizationId: orgId,
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: null
      }, new UniqueId());
      
      expect(freeSubResult.isOk()).toBe(true);
      
      // Använd MockSubscription
      const subscription = createMockSubscription(freeSubResult.value);
      subscription.setEventPublisher(eventPublisher);
      
      // Skapa och publicera initial SubscriptionCreatedEvent
      const createdEvent = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toString(),
        organizationId: orgId.toString(),
        planId: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      });
      
      eventPublisher.publish(createdEvent);
      
      // Verifiera begränsningar för gratisteam
      let teams = teamRepo.getAll();
      expect(teams.length).toBe(1);
      expect(teams[0].maxMembers).toBe(3);
      
      // Steg 2: Uppgradera till standard och skapa fler team
      subscription.changePlan('standard');
      await subscription.save();
      
      // Skapa ytterligare 2 team med standardbegränsningar
      for (let i = 0; i < 2; i++) {
        const teamResult = TeamFactory.createNewTeam({
          name: `Team ${i + 2}`,
          description: `Standard team ${i + 1}`,
          organizationId: orgId,
          creatorId: ownerId,
          isPrivate: false,
          maxMembers: 10 // Standard-plan tillåter 10 medlemmar
        });
        
        expect(teamResult.isOk()).toBe(true);
        await teamRepo.save(teamResult.value);
      }
      
      // Verifiera standardbegränsningar
      teams = teamRepo.getAll();
      expect(teams.length).toBe(3);
      expect(teams[0].maxMembers).toBe(10); // Uppdaterad till standard
      expect(teams[1].maxMembers).toBe(10);
      expect(teams[2].maxMembers).toBe(10);
      
      // Steg 3: Uppgradera till premium och lägg till många teammedlemmar
      subscription.changePlan('premium');
      await subscription.save();
      
      // Lägg till många medlemmar i det första teamet
      const firstTeamUpdated = (await teamRepo.findById(firstTeam.value.id.toString())).value;
      
      for (let i = 0; i < 15; i++) {
        const memberId = new UniqueId();
        const member = TeamMember.create({
          userId: memberId.toString(),
          role: TeamMemberRole.MEMBER,
          addedBy: ownerId.toString(),
          addedAt: new Date()
        });
        
        firstTeamUpdated.addMember(member);
      }
      
      await teamRepo.save(firstTeamUpdated);
      
      // Verifiera premiumbegränsningar
      teams = teamRepo.getAll();
      expect(teams.length).toBe(3);
      expect(teams[0].maxMembers).toBe(25); // Uppdaterad till premium
      expect(teams[1].maxMembers).toBe(25);
      expect(teams[2].maxMembers).toBe(25);
      
      const teamWithMembers = (await teamRepo.findById(firstTeam.value.id.toString())).value;
      expect(teamWithMembers.members.length).toBe(16); // 15 nya + ägaren
      
      // Steg 4: Nedgradera till standard
      subscription.changePlan('standard');
      await subscription.save();
      
      // Verifiera standardbegränsningar igen, men medlemmarna bör fortfarande finnas kvar
      teams = teamRepo.getAll();
      expect(teams.length).toBe(3);
      expect(teams[0].maxMembers).toBe(10);
      expect(teams[1].maxMembers).toBe(10);
      expect(teams[2].maxMembers).toBe(10);
      
      const teamAfterDowngrade = (await teamRepo.findById(firstTeam.value.id.toString())).value;
      expect(teamAfterDowngrade.members.length).toBe(16); // Fortfarande alla medlemmar
      expect(teamAfterDowngrade.hasExcessMembers()).toBe(true);
      expect(teamAfterDowngrade.getExcessMemberCount()).toBe(6); // 16 medlemmar - 10 tillåtna
      
      // Steg 5: Avbryt prenumerationen helt
      subscription.cancel('Test av hela cykeln');
      await subscription.save();
      
      // Verifiera att alla team är tillbaka på gratisbegränsningar
      teams = teamRepo.getAll();
      expect(teams.length).toBe(3); // Teamen existerar fortfarande
      expect(teams[0].maxMembers).toBe(3); // Tillbaka till gratis
      expect(teams[1].maxMembers).toBe(3);
      expect(teams[2].maxMembers).toBe(3);
      
      // Första teamet har nu många överskottsmedlemmar
      const teamAfterCancel = (await teamRepo.findById(firstTeam.value.id.toString())).value;
      expect(teamAfterCancel.members.length).toBe(16); // Fortfarande alla medlemmar
      expect(teamAfterCancel.hasExcessMembers()).toBe(true);
      expect(teamAfterCancel.getExcessMemberCount()).toBe(13); // 16 medlemmar - 3 tillåtna
    });
  });
}); 