import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../User';
import { UserSettings } from '../UserSettings';
import { UserStatus } from '../../value-objects/UserStatus';
import { createAggregateTestHelper } from '@/test-utils/AggregateTestHelper';
import { 
  UserStatusChangedEvent,
  UserProfileUpdatedEvent,
  UserRoleAddedEvent,
  UserRoleRemovedEvent,
  UserTeamAddedEvent,
  UserTeamRemovedEvent
} from '@/test-utils/mocks/mockUserEvents';
import { getEventData } from '@/test-utils/helpers/eventDataAdapter';
import { Email } from '../../value-objects/Email';

describe('User Invariants och Event-publicering', () => {
  let user: User;
  let testHelper: ReturnType<typeof createAggregateTestHelper<User>>;
  
  beforeEach(async () => {
    // Skapa inställningar
    const settingsResult = await UserSettings.create({
      language: 'sv',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        showTeams: true
      }
    });
    
    if (settingsResult.isErr()) {
      throw new Error(`Kunde inte skapa inställningar: ${settingsResult.error}`);
    }
    
    // Skapa användare
    const userResult = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      settings: settingsResult.value,
      teamIds: []
    });
    
    if (userResult.isErr()) {
      throw new Error(`Kunde inte skapa användare: ${userResult.error}`);
    }
    
    user = userResult.value;
    testHelper = createAggregateTestHelper(user);
  });
  
  describe('Grundläggande invarianter', () => {
    it('ska validera att e-post krävs', () => {
      // Försök skapa en användare utan e-post
      const createWithoutEmail = async () => {
        const settingsResult = await UserSettings.create({
          language: 'sv',
          theme: 'light',
          notifications: { email: true, push: true, inApp: true },
          privacy: { showProfile: true, showActivity: true, showTeams: true }
        });
        
        if (settingsResult.isErr()) {
          throw new Error(`Kunde inte skapa inställningar: ${settingsResult.error}`);
        }
        
        return User.create({
          email: '',
          name: 'Test User',
          settings: settingsResult.value,
          teamIds: []
        });
      };
      
      return createWithoutEmail().then(result => {
        expect(result.isErr()).toBe(true);
        expect(result.error).toContain('E-postadressen får inte vara tom');
      });
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
      // Använd executeAndExpectEventNames som är mer flexibel, och använd strängvärdet
      testHelper.executeAndExpectEventNames(
        u => {
          u.updateStatus('inactive'); // Använd sträng istället för UserStatus.INACTIVE objekt
        },
        ['UserStatusChangedEvent'],
        events => {
          const event = events[0];
          // Använd getEventData för att extrahera data oavsett struktur
          expect(getEventData(event, 'oldStatus')).toBe('pending');
          expect(getEventData(event, 'newStatus')).toBe('inactive');
        }
      );
    });
    
    it('ska publicera UserProfileUpdatedEvent vid profiluppdatering', () => {
      // Skapa en riktig UserProfile först
      const profileData = {
        displayName: 'Updated Name',
        bio: 'New bio'
      };
      
      // Använd executeAndExpectEventNames som är mer flexibel
      testHelper.executeAndExpectEventNames(
        u => {
          // Direkt uppdatering med objektdatat
          u.updateProfile(profileData);
        },
        ['UserProfileUpdatedEvent'],
        events => {
          const event = events[0];
          // Hitta profile-data i event-objektet
          const profile = getEventData(event, 'profile');
          
          // Kontrollera att profildatat finns
          expect(profile).toBeDefined();
        }
      );
    });
    
    it('ska publicera UserRoleAddedEvent när en roll läggs till', () => {
      const roleId = new UniqueId();
      
      testHelper.executeAndExpectEventNames(
        u => {
          u.addRole(roleId);
        },
        ['UserRoleAddedEvent'],
        events => {
          const event = events[0];
          // Använd getEventData för att extrahera data oavsett struktur
          expect(getEventData(event, 'roleId')).toBe(roleId.toString());
        }
      );
    });
    
    it('ska förhindra dubbla roller', () => {
      const roleId = new UniqueId();
      
      // Lägg till roll första gången
      const addResult1 = user.addRole(roleId);
      expect(addResult1.isOk()).toBe(true);
      
      // Försök lägga till samma roll igen
      const addResult2 = user.addRole(roleId);
      expect(addResult2.isErr()).toBe(true);
    });
    
    it('ska publicera UserRoleRemovedEvent när en roll tas bort', () => {
      const roleId = new UniqueId();
      
      // Lägg till roll först
      user.addRole(roleId);
      testHelper.clearEvents();
      
      // Ta sedan bort rollen och kontrollera event
      testHelper.executeAndExpectEventNames(
        u => {
          u.removeRole(roleId);
        },
        ['UserRoleRemovedEvent'],
        events => {
          const event = events[0];
          // Använd getEventData för att extrahera data oavsett struktur
          expect(getEventData(event, 'roleId')).toBe(roleId.toString());
        }
      );
    });
    
    it('ska publicera UserTeamAddedEvent när en användare läggs till i ett team', () => {
      const teamId = new UniqueId();
      
      testHelper.executeAndExpectEventNames(
        u => {
          u.addTeam(teamId);
        },
        ['UserTeamAddedEvent'],
        events => {
          const event = events[0];
          // Använd getEventData för att extrahera data oavsett struktur
          expect(getEventData(event, 'teamId')).toBe(teamId.toString());
        }
      );
    });
    
    it('ska förhindra dubbla team-medlemskap', () => {
      const teamId = new UniqueId();
      
      // Lägg till i team första gången
      const addResult1 = user.addTeam(teamId);
      expect(addResult1.isOk()).toBe(true);
      
      // Försök lägga till i samma team igen
      const addResult2 = user.addTeam(teamId);
      expect(addResult2.isErr()).toBe(true);
    });
    
    it('ska publicera UserTeamRemovedEvent när en användare tas bort från ett team', () => {
      const teamId = new UniqueId();
      
      // Lägg till användaren i teamet först
      user.addTeam(teamId);
      testHelper.clearEvents();
      
      // Ta sedan bort användaren från teamet och kontrollera event
      testHelper.executeAndExpectEventNames(
        u => {
          u.removeTeam(teamId);
        },
        ['UserTeamRemovedEvent'],
        events => {
          const event = events[0];
          // Använd getEventData för att extrahera data oavsett struktur
          expect(getEventData(event, 'teamId')).toBe(teamId.toString());
        }
      );
    });
    
    it('ska validera invarianter efter varje operation', () => {
      // Kontrollera att validateInvariants finns och kan köras korrekt
      const validateResult = (user as any).validateInvariants();
      expect(validateResult.isOk()).toBe(true);
      
      // Bryt en invariant och verifiera att valideringen upptäcker det
      const originalStatus = user.status;
      (user as any).props.status = 'invalid_status';
      
      const invalidResult = (user as any).validateInvariants();
      expect(invalidResult.isErr()).toBe(true);
      expect(invalidResult.error).toContain('Ogiltig användarstatus');
      
      // Återställ statusen
      (user as any).props.status = originalStatus;
    });
    
    it('ska förhindra operationer som skulle bryta invarianter', () => {
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