import { TestKit, MockEntityFactory, MockValueObjectFactory } from '../../../../test-utils';
import { Team } from '../Team';
import { TeamMemberJoinedEvent } from '../../events/TeamMemberJoinedEvent';
import { TeamMemberLeftEvent } from '../../events/TeamMemberLeftEvent';
import { TeamMemberRoleChangedEvent } from '../../events/TeamMemberRoleChangedEvent';
import { TeamUpdatedEvent } from '../../events/TeamUpdatedEvent';
import { TeamRole } from '../../value-objects/TeamRole';

describe('Team Entity (Standardized Tests)', () => {
  beforeEach(() => {
    // Förbered eventlyssnare för varje test
    TestKit.aggregate.setupTest();
  });

  afterEach(() => {
    // Rensa eventlyssnare efter varje test
    TestKit.aggregate.teardownTest();
  });

  describe('Team Creation', () => {
    it('should create a valid team with correct invariants', () => {
      // Skapa ett team med mockar
      const team = MockEntityFactory.createMockTeam({
        name: 'Test Team',
        ownerId: 'owner-123',
        settings: { maxMembers: 10 }
      }).value;
      
      // Verifiera att teamet skapades korrekt
      expect(team.name).toBe('Test Team');
      expect(team.ownerId).toBe('owner-123');
      expect(team.settings.maxMembers).toBe(10);
      
      // Verifiera att TeamCreatedEvent publicerades (implicit genom create-metoden)
      expect(team.getDomainEvents().length).toBeGreaterThan(0);
    });
    
    it('should validate team name constraints', () => {
      // Använd TeamName värde-objekt för att validera namnet
      const validNameResult = MockValueObjectFactory.createMockTeamName('Valid Team Name');
      expect(validNameResult.isOk()).toBe(true);
      
      // Testa ogiltigt namn (för kort)
      const invalidNameResult = MockValueObjectFactory.createMockTeamName('A');
      expect(invalidNameResult.isOk()).toBe(false);
    });
  });

  describe('Team Operations and Invariants', () => {
    it('should add member and publish event', () => {
      // Skapa ett team med standard mock-värden
      const team = MockEntityFactory.createMockTeam().value;
      
      // Lägg till en medlem
      team.addMember({
        userId: 'user-123',
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Verifiera att TeamMemberJoinedEvent publicerades
      const event = TestKit.aggregate.expectEventPublished(team, TeamMemberJoinedEvent);
      
      // Verifiera event-data
      expect(event.teamId).toBe(team.id.toString());
      expect(event.userId).toBe('user-123');
      expect(event.role).toBe(TeamRole.MEMBER);
    });
    
    it('should validate maximum members invariant', () => {
      // Skapa ett team med max 2 medlemmar (inklusive ägaren)
      const team = MockEntityFactory.createMockTeam({
        settings: { maxMembers: 2 }
      }).value;
      
      // Lägg till en andra medlem (maxgränsen nås)
      TestKit.invariant.expectNoInvariantViolation(team, 'addMember', [{
        userId: 'user-123',
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }]);
      
      // Försök att lägga till ytterligare en medlem (ska bryta invariant)
      TestKit.invariant.expectInvariantViolation(team, 'addMember', [{
        userId: 'user-456',
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }], 'maximal');
    });
    
    it('should validate owner cannot be removed invariant', () => {
      // Skapa ett team
      const team = MockEntityFactory.createMockTeam({
        ownerId: 'owner-123'
      }).value;
      
      // Försök att ta bort ägaren (ska bryta invariant)
      TestKit.invariant.expectInvariantViolation(team, 'removeMember', [
        'owner-123'
      ], 'owner');
      
      // Verifiera att inget TeamMemberLeftEvent publicerades
      TestKit.aggregate.expectNoEventPublished(team, TeamMemberLeftEvent);
    });
    
    it('should change member role and publish event', () => {
      // Skapa ett team med en extra medlem
      const team = MockEntityFactory.createMockTeam().value;
      team.addMember({
        userId: 'user-123',
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Rensa events från addMember-operationen
      team.clearEvents();
      
      // Ändra roll för medlemmen
      team.updateMemberRole('user-123', TeamRole.ADMIN);
      
      // Verifiera att TeamMemberRoleChangedEvent publicerades
      const event = TestKit.aggregate.expectEventPublished(team, TeamMemberRoleChangedEvent);
      
      // Verifiera event-data
      expect(event.teamId).toBe(team.id.toString());
      expect(event.userId).toBe('user-123');
      expect(event.newRole).toBe(TeamRole.ADMIN);
    });
    
    it('should update team and publish event', () => {
      // Skapa ett team
      const team = MockEntityFactory.createMockTeam().value;
      
      // Uppdatera teamet
      team.update({
        name: 'Updated Team Name',
        description: 'Updated description'
      });
      
      // Verifiera att TeamUpdatedEvent publicerades
      const event = TestKit.aggregate.expectEventPublished(team, TeamUpdatedEvent);
      
      // Verifiera event-data
      expect(event.teamId).toBe(team.id.toString());
      expect(event.name).toBe('Updated Team Name');
      expect(event.description).toBe('Updated description');
      
      // Verifiera att teamdata uppdaterades
      expect(team.name).toBe('Updated Team Name');
      expect(team.description).toBe('Updated description');
    });
    
    it('should verify event sequence for multiple operations', () => {
      // Skapa ett team
      const team = MockEntityFactory.createMockTeam().value;
      
      // Utför flera operationer i sekvens
      team.addMember({
        userId: 'user-123',
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      team.updateMemberRole('user-123', TeamRole.ADMIN);
      
      team.removeMember('user-123');
      
      // Verifiera att events publicerades i rätt ordning
      TestKit.aggregate.verifyEventSequence(team, [
        TeamMemberJoinedEvent,
        TeamMemberRoleChangedEvent,
        TeamMemberLeftEvent
      ]);
    });
  });
}); 