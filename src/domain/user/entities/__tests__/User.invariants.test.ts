import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../User';
import { createAggregateTestHelper } from '@/test-utils/AggregateTestHelper';
import { UserRoleAddedEvent } from '../../events/UserRoleAddedEvent';
import { UserRoleRemovedEvent } from '../../events/UserRoleRemovedEvent';
import { UserTeamAddedEvent } from '../../events/UserTeamAddedEvent';
import { UserTeamRemovedEvent } from '../../events/UserTeamRemovedEvent';
import { UserStatusChangedEvent } from '../../events/UserStatusChangedEvent';
import { UserProfileUpdatedEvent } from '../../events/UserProfileUpdatedEvent';
import { Email } from '../../value-objects/Email';

describe('User Invariants och Event-publicering', () => {
  let user: User;
  let testHelper: ReturnType<typeof createAggregateTestHelper<User>>;
  
  beforeEach(() => {
    const userResult = User.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    expect(userResult.isOk()).toBe(true);
    user = userResult.value;
    
    // Skapa testHelper med användaren
    testHelper = createAggregateTestHelper(user);
  });
  
  describe('Grundläggande invarianter', () => {
    it('ska validera att användaren måste ha en giltig e-post', () => {
      (user as any).props.email = null;
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = user.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('e-post');
    });
    
    it('ska validera namnlängd', () => {
      testHelper.testInvariant('name', 'A', 'namn');
    });
    
    it('ska validera att telefonnumret är giltigt om det finns', () => {
      // Skapa ett ogiltigt Phone-objekt
      const invalidPhone = { 
        value: 'abc',
        isValid: () => false
      };
      
      testHelper.testInvariant('phone', invalidPhone, 'Telefonnumret är ogiltigt');
    });
    
    it('ska validera att status är ett giltigt värde', () => {
      testHelper.testInvariant('status', 'invalid_status', 'Ogiltig användarstatus');
    });
    
    it('ska validera att teamIds inte innehåller dubletter', () => {
      const teamId = new UniqueId().toString();
      
      testHelper.testInvariant('teamIds', [teamId, teamId], 'TeamIds får inte innehålla dubbletter');
    });
    
    it('ska validera att roleIds inte innehåller dubletter', () => {
      const roleId = new UniqueId().toString();
      
      testHelper.testInvariant('roleIds', [roleId, roleId], 'RoleIds får inte innehålla dubbletter');
    });
  });
  
  describe('Event-publicering vid operationer', () => {
    it('ska publicera UserStatusChangedEvent vid statusändring', () => {
      testHelper.executeAndExpectEvents(
        u => {
          u.updateStatus('inactive');
        },
        [UserStatusChangedEvent],
        events => {
          const event = events[0] as UserStatusChangedEvent;
          expect(event.payload.oldStatus).toBe('pending');
          expect(event.payload.newStatus).toBe('inactive');
        }
      );
    });
    
    it('ska publicera UserProfileUpdatedEvent vid profiluppdatering', () => {
      testHelper.executeAndExpectEvents(
        u => {
          u.updateProfile({
            name: 'Updated Name',
            bio: 'New bio'
          });
        },
        [UserProfileUpdatedEvent],
        events => {
          const event = events[0] as UserProfileUpdatedEvent;
          expect(event.payload.name).toBe('Updated Name');
          expect(event.payload.bio).toBe('New bio');
        }
      );
    });
    
    it('ska publicera UserRoleAddedEvent när en roll läggs till', () => {
      const roleId = new UniqueId();
      
      testHelper.executeAndExpectEvents(
        u => {
          u.addRole(roleId);
        },
        [UserRoleAddedEvent],
        events => {
          const event = events[0] as UserRoleAddedEvent;
          expect(event.payload.roleId).toBe(roleId.toString());
        }
      );
    });
    
    it('ska publicera UserRoleRemovedEvent när en roll tas bort', () => {
      const roleId = new UniqueId();
      
      // Lägg först till rollen
      user.addRole(roleId);
      testHelper.clearEvents(); // Rensa tidigare events
      
      testHelper.executeAndExpectEvents(
        u => {
          u.removeRole(roleId);
        },
        [UserRoleRemovedEvent],
        events => {
          const event = events[0] as UserRoleRemovedEvent;
          expect(event.payload.roleId).toBe(roleId.toString());
        }
      );
    });
    
    it('ska publicera UserTeamAddedEvent när en användare läggs till i ett team', () => {
      const teamId = new UniqueId();
      
      testHelper.executeAndExpectEvents(
        u => {
          u.addTeam(teamId);
        },
        [UserTeamAddedEvent],
        events => {
          const event = events[0] as UserTeamAddedEvent;
          expect(event.payload.teamId).toBe(teamId.toString());
        }
      );
    });
    
    it('ska publicera UserTeamRemovedEvent när en användare tas bort från ett team', () => {
      const teamId = new UniqueId();
      
      // Lägg först till teamet
      user.addTeam(teamId);
      testHelper.clearEvents(); // Rensa tidigare events
      
      testHelper.executeAndExpectEvents(
        u => {
          u.removeTeam(teamId);
        },
        [UserTeamRemovedEvent],
        events => {
          const event = events[0] as UserTeamRemovedEvent;
          expect(event.payload.teamId).toBe(teamId.toString());
        }
      );
    });
    
    it('ska validera invarianter efter varje operation', () => {
      // Spionera på validateInvariants-metoden
      const spy = jest.spyOn((user as any), 'validateInvariants');
      
      // Uppdatera användaren
      user.updateStatus('active');
      
      // Kontrollera att validateInvariants anropades
      expect(spy).toHaveBeenCalled();
      
      // Återställ spionen
      spy.mockRestore();
    });
    
    it('ska förhindra operationer som skulle bryta invarianter', () => {
      const invalidEmail = new Email('invalid-email');
      
      // Försök att uppdatera e-postadressen med ett ogiltigt värde
      // Detta test är lite annorlunda eftersom Email-objektet själv validerar
      // och updateEmail-metoden bör avvisa ogiltiga e-postadresser
      
      // Vi behöver mocka Email.create för detta test
      jest.spyOn(Email, 'create').mockReturnValueOnce({
        isErr: () => true,
        error: 'Ogiltig e-postadress'
      } as any);
      
      const result = user.updateEmail('invalid-email');
      
      // Detta bör misslyckas med ett felmeddelande
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('e-post');
      
      // Återställ mocken
      jest.restoreAllMocks();
    });
  });
}); 