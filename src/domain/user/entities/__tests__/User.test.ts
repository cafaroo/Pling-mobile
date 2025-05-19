import { User } from '../User';
import { Email } from '../../value-objects/Email';
import { UserSettings } from '../UserSettings';
import { UserProfile } from '../../value-objects/UserProfile';
import { PhoneNumber } from '../../value-objects/PhoneNumber';
import { UniqueId } from '@/shared/core/UniqueId';
import { 
  UserCreatedEvent,
  UserProfileUpdatedEvent,
  UserSettingsUpdatedEvent,
  UserStatusChangedEvent,
  UserTeamAddedEvent,
  UserTeamRemovedEvent,
  UserEmailUpdatedEvent,
  UserRoleAddedEvent,
  UserRoleRemovedEvent
} from '@/test-utils/mocks/mockUserEvents';
import { mockDomainEvents } from '@/test-utils/mocks';
import { validateEvents, validateNoEvents, validateEventAttributes, validateInvariant } from '@/test-utils/eventTestHelper';
import { EventNameHelper } from '@/test-utils/EventNameHelper';

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
      
      // Act & Assert - direkt validering istället för validateEvents
      // Utför operationen
      user.updateSettings(newSettings);
      
      // Verifiera att inställningarna uppdaterades
      expect(user.settings).toBe(newSettings);
      
      // Verifiera att rätt event har publicerats
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0, 'Inget event publicerades');
      expect(events.some(e => 
        EventNameHelper.getEventName(e).includes('UserSettings') || 
        EventNameHelper.getEventName(e).includes('SettingsUpdated'))
      ).toBe(true);
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
      
      // Rensa tidigare events
      mockDomainEvents.clearEvents();
      
      // Act - uppdatera status
      user.updateStatus('active');
      
      // Assert - kontrollera att statusen uppdaterades
      expect(user.status).toBe('active');
      
      // Verifiera att rätt event har publicerats
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0, 'Inget event publicerades');
      
      // Hitta statusändringseventet
      const statusEvent = events.find(e => 
        EventNameHelper.getEventName(e).includes('Status'));
      
      expect(statusEvent).toBeDefined();
      if (!statusEvent) throw new Error('Inget StatusChanged-event hittades');
      
      // Kontrollera attribut med flexiblare metod
      if (statusEvent) {
        // Hitta attributen var de än finns (direkt, i data eller i payload)
        const oldStatus = 
          statusEvent.oldStatus || 
          (statusEvent.data && statusEvent.data.oldStatus) || 
          (statusEvent.payload && statusEvent.payload.oldStatus);
          
        const newStatus = 
          statusEvent.newStatus || 
          (statusEvent.data && statusEvent.data.newStatus) || 
          (statusEvent.payload && statusEvent.payload.newStatus);
        
        expect(oldStatus).toBe('pending');
        expect(newStatus).toBe('active');
      }
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
      
      // Rensa tidigare events
      mockDomainEvents.clearEvents();
      
      // Act - lägg till team
      user.addTeam(teamId);
      
      // Assert - kontrollera att teamet lades till
      expect(user.teamIds).toContain(teamId);
      
      // Verifiera att rätt event har publicerats
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0, 'Inget event publicerades');
      
      // Hitta teamAddedEvent
      const teamEvent = events.find(e => 
        EventNameHelper.getEventName(e).includes('TeamAdded'));
      
      expect(teamEvent).toBeDefined();
      if (!teamEvent) throw new Error('Inget TeamAdded-event hittades');
    });
    
    test('ska ta bort team och publicera UserTeamRemovedEvent', () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User'
      }).value;
      
      const teamId = new UniqueId().toString();
      user.addTeam(teamId);
      
      // Rensa tidigare events
      mockDomainEvents.clearEvents();
      
      // Act - ta bort team
      user.removeTeam(teamId);
      
      // Assert - kontrollera att teamet togs bort
      expect(user.teamIds).not.toContain(teamId);
      
      // Verifiera att rätt event har publicerats
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0, 'Inget event publicerades');
      
      // Hitta teamRemovedEvent
      const teamEvent = events.find(e => 
        EventNameHelper.getEventName(e).includes('TeamRemoved'));
      
      expect(teamEvent).toBeDefined();
      if (!teamEvent) throw new Error('Inget TeamRemoved-event hittades');
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
      
      // Rensa tidigare events
      mockDomainEvents.clearEvents();
      
      // Act - försök med email som string istället för Email-objekt
      const updateResult = user.updateEmail('new@example.com');
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      expect(user.email.value).toBe('new@example.com');
      
      // Verifiera att rätt event har publicerats
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0, 'Inget event publicerades');
      expect(events.some(e => 
        EventNameHelper.getEventName(e).includes('EmailUpdated'))
      ).toBe(true, 'Inget EmailUpdated-event hittades');
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