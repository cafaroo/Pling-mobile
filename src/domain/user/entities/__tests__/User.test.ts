import { User } from '../User';
import { Email } from '../../value-objects/Email';
import { UserSettings } from '../UserSettings';
import { UserProfile } from '../../value-objects/UserProfile';
import { PhoneNumber } from '../../value-objects/PhoneNumber';
import { UniqueId } from '@/shared/core/UniqueId';
import { UserCreatedEvent } from '../../events/UserCreatedEvent';
import { UserProfileUpdatedEvent } from '../../events/UserProfileUpdatedEvent';
import { UserSettingsUpdatedEvent } from '../../events/UserSettingsUpdatedEvent';
import { UserStatusChangedEvent } from '../../events/UserStatusChangedEvent';
import { UserTeamAddedEvent } from '../../events/UserTeamAddedEvent';
import { UserTeamRemovedEvent } from '../../events/UserTeamRemovedEvent';
import { mockDomainEvents } from '@/test-utils/mocks';
import { validateEvents, validateNoEvents, validateEventAttributes, validateInvariant } from '@/test-utils/eventTestHelper';

describe('User Aggregate', () => {
  beforeEach(() => {
    mockDomainEvents.clearEvents();
  });

  afterEach(() => {
    mockDomainEvents.clearEvents();
  });

  describe('Skapande av User', () => {
    test('ska skapa en giltig användare', () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      
      // Act
      const userResult = User.create({
        email,
        name
      });
      
      // Assert
      expect(userResult.isOk()).toBe(true);
      
      if (userResult.isOk()) {
        const user = userResult.value;
        expect(user.email.value).toBe(email);
        expect(user.name).toBe(name);
        expect(user.settings).toBeDefined();
        expect(user.status).toBe('pending');
      }
    });
    
    test('ska publicera UserCreatedEvent vid skapande', () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      
      // Act & Assert
      validateEvents(
        () => {
          User.create({
            email,
            name
          });
        },
        [UserCreatedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserCreatedEvent, {
            email: email
          });
        }
      );
    });
    
    test('ska avvisa skapande med ogiltig e-post', () => {
      // Act & Assert
      validateInvariant(
        () => User.create({
          email: 'invalid-email',
          name: 'Test User'
        }),
        'e-post'
      );
    });
    
    test('ska avvisa skapande med för kort namn', () => {
      // Act & Assert
      validateInvariant(
        () => User.create({
          email: 'valid@example.com',
          name: 'A' // För kort namn
        }),
        'namn'
      );
    });
  });

  describe('Profilhantering', () => {
    test('ska uppdatera profil och publicera UserProfileUpdatedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const profile = UserProfile.create({
        displayName: 'Updated Name',
        bio: 'New bio'
      }).value;
      
      // Act & Assert
      validateEvents(
        () => {
          user.updateProfile(profile);
        },
        [UserProfileUpdatedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserProfileUpdatedEvent, {
            profile: profile
          });
        }
      );
      
      // Verifiera att profilen uppdaterades
      expect(user.profile).toBe(profile);
    });
  });

  describe('Inställningshantering', () => {
    test('ska uppdatera inställningar och publicera UserSettingsUpdatedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const newSettings = UserSettings.createDefault();
      
      // Act & Assert
      validateEvents(
        () => {
          user.updateSettings(newSettings);
        },
        [UserSettingsUpdatedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserSettingsUpdatedEvent, {
            settings: newSettings
          });
        }
      );
      
      // Verifiera att inställningarna uppdaterades
      expect(user.settings).toBe(newSettings);
    });
  });
  
  describe('Statushantering', () => {
    test('ska uppdatera status och publicera UserStatusChangedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User',
        status: 'pending'
      }).value;
      
      // Act & Assert
      validateEvents(
        () => {
          user.updateStatus('active');
        },
        [UserStatusChangedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserStatusChangedEvent, {
            oldStatus: 'pending',
            newStatus: 'active'
          });
        }
      );
      
      // Verifiera att statusen uppdaterades
      expect(user.status).toBe('active');
    });
    
    test('ska avvisa ogiltig status', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      // Act & Assert
      const updateResult = user.updateStatus('invalid' as any);
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
      expect(updateResult.error).toContain('Ogiltig användarstatus');
    });
  });
  
  describe('Teamhantering', () => {
    test('ska lägga till team och publicera UserTeamAddedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      
      // Act & Assert
      validateEvents(
        () => {
          user.addTeam(teamId);
        },
        [UserTeamAddedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserTeamAddedEvent, {
            teamId: teamId
          });
        }
      );
      
      // Verifiera att teamet lades till
      expect(user.teamIds).toContain(teamId);
    });
    
    test('ska ta bort team och publicera UserTeamRemovedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      user.addTeam(teamId);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act & Assert
      validateEvents(
        () => {
          user.removeTeam(teamId);
        },
        [UserTeamRemovedEvent],
        (events) => {
          validateEventAttributes(events, 0, UserTeamRemovedEvent, {
            teamId: teamId
          });
        }
      );
      
      // Verifiera att teamet togs bort
      expect(user.teamIds).not.toContain(teamId);
    });
    
    test('ska hantera duplicerade team korrekt', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      user.addTeam(teamId);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act & Assert
      validateNoEvents(() => {
        const result = user.addTeam(teamId);
        expect(result.isErr()).toBe(true);
        expect(result.error).toContain('redan medlem');
      });
    });
    
    test('ska hantera icke-existerande team korrekt vid borttagning', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      
      // Act & Assert
      validateNoEvents(() => {
        const result = user.removeTeam(teamId);
        expect(result.isErr()).toBe(true);
        expect(result.error).toContain('inte medlem');
      });
    });
  });
  
  describe('E-posthantering', () => {
    test('ska uppdatera e-post', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const newEmail = Email.create('new@example.com').value;
      
      // Act
      const updateResult = user.updateEmail(newEmail);
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      expect(user.email.value).toBe('new@example.com');
    });
    
    test('ska validera e-post vid uppdatering', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      // Act
      const updateResult = user.updateEmail('invalid-email');
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
    });
  });
  
  describe('Invarianter', () => {
    test('ska validera unika teamIds', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      
      // Lägg direkt till samma teamId två gånger i props för att testa invarianten
      (user as any).props.teamIds = [teamId, teamId];
      
      // Act
      const validationResult = (user as any).validateInvariants();
      
      // Assert
      expect(validationResult.isErr()).toBe(true);
      expect(validationResult.error).toContain('TeamIds får inte innehålla dubbletter');
    });
    
    test('ska validera unika roleIds', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const roleId = new UniqueId().toString();
      
      // Lägg direkt till samma roleId två gånger i props för att testa invarianten
      (user as any).props.roleIds = [roleId, roleId];
      
      // Act
      const validationResult = (user as any).validateInvariants();
      
      // Assert
      expect(validationResult.isErr()).toBe(true);
      expect(validationResult.error).toContain('RoleIds får inte innehålla dubbletter');
    });
  });
}); 