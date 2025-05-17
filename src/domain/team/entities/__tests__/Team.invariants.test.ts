import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '../Team';
import { TeamMember } from '../../value-objects/TeamMember';
import { TeamRole } from '../../value-objects/TeamRole';
import { createAggregateTestHelper } from '@/test-utils/AggregateTestHelper';
import { TeamUpdatedEvent } from '../../events/TeamUpdatedEvent';
import { TeamMemberJoinedEvent } from '../../events/TeamMemberJoinedEvent';
import { TeamMemberLeftEvent } from '../../events/TeamMemberLeftEvent';
import { TeamMemberRoleChangedEvent } from '../../events/TeamMemberRoleChangedEvent';

describe('Team Invariants och Event-publicering', () => {
  let team: Team;
  let ownerId: UniqueId;
  let testHelper: ReturnType<typeof createAggregateTestHelper<Team>>;
  
  beforeEach(() => {
    // Skapa en unik ID för ägaren
    ownerId = new UniqueId('test-owner-id');
    
    // Lägg till ägaren som medlem med OWNER-roll
    const teamResult = Team.create({
      name: 'Test Team',
      description: 'Test Description',
      ownerId: ownerId
    });
    
    // Om teamet inte kunde skapas korrekt, logga felet för att underlätta debugging
    if (teamResult.isErr()) {
      console.error('Kunde inte skapa team:', teamResult.error);
    }
    
    // Förvänta oss att teamet skapades korrekt
    expect(teamResult.isOk()).toBe(true);
    team = teamResult.value;
    
    // Kontrollera att ägaren faktiskt har lagts till som medlem
    const ownerMember = team.members.find(m => m.userId.equals(ownerId));
    expect(ownerMember).toBeDefined();
    expect(ownerMember?.role).toBe(TeamRole.OWNER);
    
    // Skapa testHelper med teamet
    testHelper = createAggregateTestHelper(team);
  });
  
  describe('Grundläggande invarianter', () => {
    it('ska validera att teamet måste ha ett namn', () => {
      testHelper.testInvariant('name', null, 'Team måste ha ett namn');
    });
    
    it('ska validera att teamet måste ha en ägare', () => {
      testHelper.testInvariant('ownerId', null, 'Team måste ha en ägare');
    });
    
    it('ska validera att ägaren är medlem med OWNER-roll', () => {
      // Ta bort alla medlemmar inklusive ägaren
      (team as any).props.members = [];
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = team.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägaren måste vara medlem i teamet med OWNER-roll');
    });
    
    it('ska validera att varje användare bara har en roll i teamet', () => {
      const memberId = new UniqueId('test-duplicate-member');
      
      // Skapa två medlemsobjekt med samma användar-ID men olika roller
      const member1 = new TeamMember({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      const member2 = new TeamMember({
        userId: memberId,
        role: TeamRole.ADMIN,
        joinedAt: new Date()
      });
      
      // Lägg till båda i teamets medlemslista
      (team as any).props.members.push(member1);
      (team as any).props.members.push(member2);
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = team.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('En användare kan bara ha en roll i teamet');
    });
    
    it('ska validera medlemsgränser', () => {
      // Sätt en max medlemsgräns
      (team as any).props.settings.props.maxMembers = 3;
      
      // Lägg till fler medlemmar än tillåtet (notera att ägaren redan är medlem)
      for (let i = 0; i < 3; i++) {
        const memberId = new UniqueId(`test-member-${i}`);
        const member = new TeamMember({
          userId: memberId,
          role: TeamRole.MEMBER,
          joinedAt: new Date()
        });
        
        (team as any).props.members.push(member);
      }
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = team.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Teamet har överskridit sin medlemsgräns');
    });
  });
  
  describe('Event-publicering vid operationer', () => {
    it('ska publicera TeamUpdatedEvent vid uppdatering', () => {
      // Uppdatera teamet
      testHelper.executeAndExpectEvents(
        t => {
          t.update({
            name: 'Updated Team Name',
            description: 'Updated description'
          });
        },
        [TeamUpdatedEvent],
        events => {
          expect((events[0] as TeamUpdatedEvent).payload.name).toBe('Updated Team Name');
        }
      );
    });
    
    it('ska publicera MemberJoinedEvent när en medlem läggs till', () => {
      // Skapa en ny medlem
      const memberId = new UniqueId('test-new-member');
      const member = new TeamMember({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Lägg till medlemmen och kontrollera events
      testHelper.executeAndExpectEvents(
        t => {
          t.addMember(member);
        },
        [TeamMemberJoinedEvent],
        events => {
          const event = events[0] as TeamMemberJoinedEvent;
          expect(event.payload.userId).toBe(memberId.toString());
          expect(event.payload.role).toBe(TeamRole.MEMBER);
        }
      );
    });
    
    it('ska publicera MemberLeftEvent när en medlem tas bort', () => {
      // Lägg först till en medlem
      const memberId = new UniqueId('test-remove-member');
      const member = new TeamMember({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      team.addMember(member);
      testHelper.clearEvents(); // Rensa tidigare events
      
      // Ta bort medlemmen och kontrollera event
      testHelper.executeAndExpectEvents(
        t => {
          t.removeMember(memberId);
        },
        [TeamMemberLeftEvent],
        events => {
          const event = events[0] as TeamMemberLeftEvent;
          expect(event.payload.userId).toBe(memberId.toString());
        }
      );
    });
    
    it('ska publicera TeamMemberRoleChangedEvent när en medlems roll ändras', () => {
      // Lägg först till en medlem
      const memberId = new UniqueId('test-role-change-member');
      const member = new TeamMember({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      team.addMember(member);
      testHelper.clearEvents(); // Rensa tidigare events
      
      // Ändra medlemmens roll och kontrollera event
      testHelper.executeAndExpectEvents(
        t => {
          t.updateMemberRole(memberId, TeamRole.ADMIN);
        },
        [TeamMemberRoleChangedEvent],
        events => {
          const event = events[0] as TeamMemberRoleChangedEvent;
          expect(event.payload.userId).toBe(memberId.toString());
          expect(event.payload.oldRole).toBe(TeamRole.MEMBER);
          expect(event.payload.newRole).toBe(TeamRole.ADMIN);
        }
      );
    });
    
    it('ska validera invarianter efter varje operation', () => {
      // Spionera på validateInvariants-metoden
      const spy = jest.spyOn((team as any), 'validateInvariants');
      
      // Uppdatera teamet
      team.update({ name: 'Updated Team Name' });
      
      // Kontrollera att validateInvariants anropades
      expect(spy).toHaveBeenCalled();
      
      // Återställ spionen
      spy.mockRestore();
    });
    
    it('ska förhindra operationer som skulle bryta invarianter', () => {
      // Försök att ta bort ägaren från teamet
      const result = team.removeMember(ownerId);
      
      // Detta bör misslyckas med ett felmeddelande
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägaren kan inte tas bort från teamet');
    });
  });
}); 