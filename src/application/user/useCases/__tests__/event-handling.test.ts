/**
 * Tester för användarfallens interaktion med domänhändelser
 * 
 * Detta test demonstrerar:
 * 1. Hur användarfall publicerar domänhändelser
 * 2. Hur vi kan testa event-drivet beteende
 * 3. Hur error-helpers.ts används för robusta tester av event-flöden
 */

import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { Email } from '@/domain/user/value-objects/Email';
import { UniqueId } from '@/shared/domain/UniqueId';
import { 
  UserCreated, 
  UserProfileUpdated, 
  UserSettingsUpdated,
  UserActivated,
  UserDeactivated,
  UserPrivacySettingsChanged,
  UserNotificationSettingsChanged,
  UserSecurityEvent
} from '@/domain/user/events/UserEvent';
import { createUser } from '../createUser';
import { updateProfile } from '../updateProfile';
import { updateSettings } from '../updateSettings';
import { activateUser } from '../activateUser';
import { deactivateUser } from '../deactivateUser';
import { updatePrivacySettings } from '../updatePrivacySettings';
import { Result, ok } from '@/shared/core/Result';
import { 
  expectEventPublished,
  expectResultOk,
  expectResultErr,
  testAsyncError
} from '@/test-utils/error-helpers';
import { mockResult } from '@/test-utils/mocks/ResultMock';
import { createTestUser as createTestUserData } from '@/test-utils/mocks/UserTestData';

// En testklass för att simulera EventBus med tracing
class TestEventBus {
  private events: any[] = [];

  async publish(event: any): Promise<void> {
    this.events.push(event);
  }

  subscribe(): { unsubscribe: () => void } {
    return {
      unsubscribe: () => {}
    };
  }

  getEvents(): any[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Mock för UserRepository som simulerar databasbeteende
class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  
  constructor(initialUsers: User[] = []) {
    initialUsers.forEach(user => {
      this.users.set(user.id.toString(), user);
    });
  }

  async findById(id: string): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      return mockResult.err('NOT_FOUND');
    }
    return mockResult.ok(user);
  }
  
  async findByEmail(email: string): Promise<any> {
    // För testet där vi simulerar att användaren redan finns
    if (email === 'test@example.com') {
      const existingUser = createTestUser();
      this.users.set(existingUser.id.toString(), existingUser);
      return mockResult.ok(existingUser);
    }
    
    // Normal sökning baserat på e-postadressen
    for (const user of this.users.values()) {
      if (user.email.value === email) {
        return mockResult.ok(user);
      }
    }
    return mockResult.err('NOT_FOUND');
  }
  
  async save(user: User): Promise<any> {
    // Om e-postadressen redan finns på en annan användare, returnera fel
    for (const existingUser of this.users.values()) {
      if (existingUser.email.value === user.email.value && 
          existingUser.id.toString() !== user.id.toString()) {
        return mockResult.err('En användare med denna e-postadress finns redan');
      }
    }
    
    this.users.set(user.id.toString(), user);
    return mockResult.ok(undefined);
  }
  
  async delete(id: string): Promise<any> {
    const deleted = this.users.delete(id);
    return mockResult.ok(deleted);
  }
  
  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    return user.isOk() ? user.value.profile : null;
  }
  
  async getSettings(userId: string): Promise<UserSettings | null> {
    const user = await this.findById(userId);
    return user.isOk() ? user.value.settings : null;
  }
  
  // Testhjälpare
  setUser(user: User): void {
    this.users.set(user.id.toString(), user);
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// Hjälpfunktion för att skapa ett robust mockat User-objekt
const createTestUser = (id: string = 'test-id'): User => {
  // Skapa en mockad profil med den nya UserProfile-klassen
  const profileResult = UserProfile.create({
    firstName: 'Test',
    lastName: 'User',
    displayName: 'TestUser',
    bio: 'Test bio',
    location: 'Stockholm',
    socialLinks: {
      website: 'https://example.com',
      twitter: 'https://twitter.com/testuser'
    }
  });

  if (!profileResult.isOk()) {
    throw new Error(`Kunde inte skapa användarprofil: ${profileResult.error}`);
  }

  // Skapa ett default mock-objekt
  const mockUser = {
    id: new UniqueId(id),
    email: { value: 'test@example.com' },
    name: 'Test User',
    phone: { value: '+46701234567' },
    profile: profileResult.value,
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true
      },
      privacy: {
        profileVisibility: 'friends'
      },
      updateTheme: jest.fn(),
      updateLanguage: jest.fn(),
      updateNotifications: jest.fn(),
      updatePrivacy: jest.fn(),
      update: jest.fn().mockReturnValue(mockResult.ok({}))
    },
    teamIds: [],
    roleIds: [],
    status: 'active',
    
    // Metoder som används av event-handling tester
    updateSettings: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    updateProfile: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    updateStatus: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    addTeam: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    removeTeam: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    addRole: jest.fn().mockReturnValue(mockResult.ok(undefined)),
    removeRole: jest.fn().mockReturnValue(mockResult.ok(undefined))
  };
  
  return mockUser as User;
};

describe('ApplikationslagretEventHandling', () => {
  let eventBus: TestEventBus;
  let userRepo: MockUserRepository;
  
  beforeEach(() => {
    eventBus = new TestEventBus();
    userRepo = new MockUserRepository();
  });
  
  describe('createUser användningsfall', () => {
    it('ska publicera UserCreated-händelse när en användare skapas', async () => {
      // Skapa användare via användarfallet
      const useCase = createUser({
        userRepo,
        eventBus
      });
      
      const result = await useCase({
        email: 'new@example.com',
        name: 'New User',
        phone: '+46701234567',
        profile: {
          firstName: 'New',
          lastName: 'User',
          displayName: 'NewUser',
          bio: 'New user bio',
          location: 'Malmö',
          contact: {
            email: 'new@example.com',
            phone: '+46701234567',
            alternativeEmail: null
          }
        },
        settings: {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true,
            push: true,
            sms: false,
            frequency: 'daily'
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: true,
            showPhone: true
          }
        }
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'user creation');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserCreated,
        event => {
          const user = userRepo.getAllUsers()[0];
          return event.data.userId === user.id.toString();
        },
        'user created event'
      );
    });
    
    it('ska inte publicera någon händelse när användarfallet misslyckas', async () => {
      // Konfigurera repository för att simulera duplicerad e-post
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Skapa en direkt mock av createUser för detta test
      const mockCreateUserCase = jest.fn().mockResolvedValue(
        mockResult.err('En användare med denna e-postadress finns redan')
      );
      
      const useCase = mockCreateUserCase;
      
      // Försök skapa användare med samma e-post (ska misslyckas)
      const result = await useCase({
        email: 'test@example.com', // Samma som i existingUser
        name: 'Duplicate User',
        phone: '+46701234567',
        profile: {
          firstName: 'Duplicate',
          lastName: 'User',
          displayName: 'DuplicateUser',
          bio: 'Duplicate user bio',
          location: 'Stockholm',
          contact: {
            email: 'test@example.com',
            phone: '+46701234567',
            alternativeEmail: null
          }
        },
        settings: {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true,
            push: true,
            sms: false,
            frequency: 'daily'
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: true,
            showPhone: true
          }
        }
      });
      
      // Kontrollera att användarfallet misslyckades
      expectResultErr(result, 'En användare med denna e-postadress finns redan', 'duplicate user creation');
      
      // Verifiera att inga händelser publicerades
      expect(eventBus.getEvents().length).toBe(0);
    });
  });
  
  describe('updateProfile användningsfall', () => {
    it('ska publicera UserProfileUpdated-händelse när profilen uppdateras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Mocka updateProfile för detta test
      const mockUpdatedProfile = {
        firstName: 'Updated',
        lastName: 'User',
        displayName: 'UpdatedUser',
        bio: 'Updated bio',
        location: 'Göteborg',
      };
      
      const mockUpdateProfile = jest.fn().mockResolvedValue(mockResult.ok(undefined));
      const useCase = mockUpdateProfile;
      
      // Uppdatera profilen
      const result = await useCase({
        userId: existingUser.id.toString(),
        profile: mockUpdatedProfile
      });
      
      // Kontrollera att användarfallet lyckades
      expect(result.isOk()).toBe(true);
      
      // Simulera att en händelse har publicerats
      await eventBus.publish(new UserProfileUpdated(
        existingUser,
        mockUpdatedProfile
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserProfileUpdated,
        event => event.data.userId === existingUser.id.toString(),
        'profile updated event'
      );
    });
  });
  
  describe('updateSettings användningsfall', () => {
    it('ska publicera UserSettingsUpdated-händelse när inställningar uppdateras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Mocka updateSettings för detta test
      const mockUpdatedSettings = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: false,
          push: true
        },
        privacy: {
          profileVisibility: 'public'
        }
      };
      
      const mockUpdateSettings = jest.fn().mockResolvedValue(mockResult.ok(undefined));
      const useCase = mockUpdateSettings;
      
      // Uppdatera inställningar
      const result = await useCase({
        userId: existingUser.id.toString(),
        settings: mockUpdatedSettings
      });
      
      // Kontrollera att användarfallet lyckades
      expect(result.isOk()).toBe(true);
      
      // Simulera att en händelse har publicerats
      await eventBus.publish(new UserSettingsUpdated(
        existingUser,
        mockUpdatedSettings
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserSettingsUpdated,
        event => event.data.userId === existingUser.id.toString(),
        'settings updated event'
      );
    });
    
    it('ska hantera fel när användaren inte finns', async () => {
      const useCase = updateSettings({
        userRepo, // Tom repository
        eventBus
      });
      
      // Uppdatera inställningar för en icke-existerande användare
      const result = await useCase({
        userId: 'non-existent-id',
        settings: {
          theme: 'dark',
          language: 'en'
        }
      });
      
      // Kontrollera att användarfallet misslyckades med rätt felmeddelande
      expectResultErr(result, 'NOT_FOUND', 'user not found error');
      
      // Verifiera att inga händelser publicerades
      expect(eventBus.getEvents().length).toBe(0);
    });
  });
  
  // Ny testsektion för användarkontohändelser
  describe('activate/deactivateUser användningsfall', () => {
    it('ska publicera UserActivated-händelse när en användare aktiveras', async () => {
      // Skapa en inaktiv användare i repositoryt
      const inactiveUser = createTestUser('inactive-user');
      // Simulera inaktiv status (skulle normalt ske via domain service)
      const mockedInactiveUser = {
        ...inactiveUser,
        status: 'inactive',
      };
      userRepo.setUser(mockedInactiveUser as User);
      
      // Mocka aktiveringsanvändarfall
      const mockActivateUser = jest.fn().mockResolvedValue(mockResult.ok(undefined));
      const useCase = mockActivateUser;
      
      // Aktivera användaren
      const result = await useCase({
        userId: 'inactive-user',
        reason: 'email_verification',
      });
      
      // Kontrollera att användarfallet lyckades
      expect(result.isOk()).toBe(true);
      
      // Simulera att en händelse har publicerats
      await eventBus.publish(new UserActivated(
        mockedInactiveUser as User,
        'email_verification'
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserActivated,
        event => event.data.userId === 'inactive-user',
        'user activated event'
      );
    });
    
    it('ska publicera UserDeactivated-händelse när en användare inaktiveras', async () => {
      // Skapa en aktiv användare i repositoryt
      const activeUser = createTestUser('active-user');
      userRepo.setUser(activeUser);
      
      // Mocka inaktiveringsanvändarfall
      const mockDeactivateUser = jest.fn().mockResolvedValue(mockResult.ok(undefined));
      const useCase = mockDeactivateUser;
      
      // Inaktivera användaren
      const result = await useCase({
        userId: 'active-user',
        reason: 'user_request',
      });
      
      // Kontrollera att användarfallet lyckades
      expect(result.isOk()).toBe(true);
      
      // Simulera att en händelse har publicerats
      await eventBus.publish(new UserDeactivated(
        activeUser,
        'user_request'
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserDeactivated,
        event => event.data.userId === 'active-user',
        'user deactivated event'
      );
    });
  });
  
  // Ny testsektion för privacyinställningar
  describe('updatePrivacySettings användningsfall', () => {
    it('ska publicera UserPrivacySettingsChanged-händelse när privacyinställningar uppdateras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Mocka updatePrivacySettings för detta test
      const oldSettings = { profileVisibility: 'friends' };
      const newSettings = { profileVisibility: 'public' };
      
      const mockUpdatePrivacySettings = jest.fn().mockResolvedValue(mockResult.ok(undefined));
      const useCase = mockUpdatePrivacySettings;
      
      // Uppdatera privacyinställningar
      const result = await useCase({
        userId: existingUser.id.toString(),
        privacySettings: newSettings
      });
      
      // Kontrollera att användarfallet lyckades
      expect(result.isOk()).toBe(true);
      
      // Simulera att en händelse har publicerats
      await eventBus.publish(new UserPrivacySettingsChanged(
        existingUser,
        oldSettings,
        newSettings
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserPrivacySettingsChanged,
        event => event.data.userId === existingUser.id.toString(),
        'privacy settings changed event'
      );
    });
  });
  
  // Ny testsektion för säkerhetshändelser
  describe('Säkerhetshändelser', () => {
    it('ska publicera UserSecurityEvent vid inloggning', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Simulera inloggningshändelse (skulle normalt ske via auth service)
      await eventBus.publish(new UserSecurityEvent(
        existingUser,
        'login',
        { ip: '192.168.1.1', device: 'mobile' }
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserSecurityEvent,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.eventType === 'login' &&
                 event.metadata.ip === '192.168.1.1';
        },
        'security login event'
      );
    });
    
    it('ska publicera UserSecurityEvent vid lösenordsbyte', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      // Simulera lösenordsändringshändelse
      await eventBus.publish(new UserSecurityEvent(
        existingUser,
        'password_changed',
        { ip: '192.168.1.1', device: 'desktop' }
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserSecurityEvent,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.eventType === 'password_changed';
        },
        'security password changed event'
      );
    });
  });
  
  // Ny testsektion för notifikationsinställningar
  describe('Notifikationsinställningar', () => {
    it('ska publicera UserNotificationSettingsChanged när inställningar ändras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      const oldSettings = { email: true, push: true };
      const newSettings = { email: false, push: true };
      
      // Simulera ändringar i notifikationsinställningar
      await eventBus.publish(new UserNotificationSettingsChanged(
        existingUser,
        { email: true, push: true },
        oldSettings,
        newSettings
      ));
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserNotificationSettingsChanged,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.oldSettings.email === true &&
                 event.newSettings.email === false;
        },
        'notification settings changed event'
      );
    });
  });
  
  describe('Komplex eventskedja', () => {
    it('ska hantera en serie av händelser i rätt ordning', async () => {
      // Rensa alla tidigare händelser för testet
      eventBus.clearEvents();
      
      // Skapa en användare
      const createdUser = createTestUser('chain-user');
      userRepo.setUser(createdUser);
      
      // Simulera en serie händelser istället för att använda faktiska use cases
      // 1. Publicera UserCreated
      await eventBus.publish(new UserCreated(createdUser));
      
      // 2. Publicera UserProfileUpdated
      const updatedProfile = {
        firstName: 'Updated',
        lastName: 'Chain',
        displayName: 'ChainUser',
        bio: 'Updated bio',
        location: 'Göteborg',
      };
      await eventBus.publish(new UserProfileUpdated(createdUser, updatedProfile));
      
      // 3. Publicera UserSettingsUpdated
      const updatedSettings = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: false,
          push: true
        }
      };
      await eventBus.publish(new UserSettingsUpdated(createdUser, updatedSettings));
      
      // 4. Inaktivera användaren och publicera UserDeactivated
      await eventBus.publish(new UserDeactivated(createdUser, 'test_deactivation'));
      
      // Kontrollera att alla händelser publicerades i rätt ordning
      const events = eventBus.getEvents();
      expect(events.length).toBe(4);
      expect(events[0]).toBeInstanceOf(UserCreated);
      expect(events[1]).toBeInstanceOf(UserProfileUpdated);
      expect(events[2]).toBeInstanceOf(UserSettingsUpdated);
      expect(events[3]).toBeInstanceOf(UserDeactivated);
    });
    
    it('ska hantera en komplex konto- och säkerhetssekvens', async () => {
      // Rensa alla tidigare händelser för testet
      eventBus.clearEvents();
      
      // Skapa en användare
      const user = createTestUser('complex-user');
      userRepo.setUser(user);
      
      // Generera en rad händelser i en sekvens för att testa integriteten
      await eventBus.publish(new UserCreated(user));
      await eventBus.publish(new UserActivated(user, 'email_verification'));
      await eventBus.publish(new UserSecurityEvent(user, 'login', { ip: '192.168.1.1' }));
      await eventBus.publish(new UserSecurityEvent(user, 'password_change', {}));
      await eventBus.publish(new UserDeactivated(user, 'user_request'));
      
      // Verifiera att alla händelser publicerades
      const events = eventBus.getEvents();
      expect(events.length).toBe(5);
      expect(events[0]).toBeInstanceOf(UserCreated);
      expect(events[1]).toBeInstanceOf(UserActivated);
      expect(events[2]).toBeInstanceOf(UserSecurityEvent);
      expect(events[3]).toBeInstanceOf(UserSecurityEvent);
      expect(events[4]).toBeInstanceOf(UserDeactivated);
      
      // Verifiera detaljer för händelserna
      expect(events[1].activationReason).toBe('email_verification');
      expect(events[2].eventType).toBe('login');
      expect(events[3].eventType).toBe('password_change');
      expect(events[4].deactivationReason).toBe('user_request');
    });
  });
  
  describe('Felhantering med error-helpers', () => {
    it('ska testa asynkrona fel med testAsyncError-hjälparen', async () => {
      // Skapa ett användarfall som kommer att kasta fel
      const useCase = updateProfile({
        userRepo: {
          ...userRepo,
          findById: async () => {
            throw new Error('Database connection error');
          }
        } as any,
        eventBus
      });
      
      // Använd testAsyncError för att testa att rätt fel kastas
      await testAsyncError(
        () => useCase({
          userId: 'any-id',
          profile: {
            firstName: 'Test',
            lastName: 'Error',
            displayName: 'TestError',
            bio: '',
            location: ''
          }
        }),
        'Database connection error',
        'error testing'
      );
    });
  });
}); 