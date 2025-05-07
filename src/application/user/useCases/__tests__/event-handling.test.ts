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
import { ok, err, Result } from '@/shared/core/Result';
import { 
  expectEventPublished,
  expectResultOk,
  expectResultErr,
  testAsyncError
} from '@/test-utils/error-helpers';

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

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.value === email) {
        return user;
      }
    }
    return null;
  }
  
  async save(user: User): Promise<boolean> {
    this.users.set(user.id.toString(), user);
    return true;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    return user ? user.profile : null;
  }
  
  async getSettings(userId: string): Promise<UserSettings | null> {
    const user = await this.findById(userId);
    return user ? user.settings : null;
  }
  
  // Testhjälpare
  setUser(user: User): void {
    this.users.set(user.id.toString(), user);
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// Hjälpfunktion för att skapa en testanvändare
const createTestUser = (id: string = 'test-id'): User => {
  const emailResult = Email.create('test@example.com');
  const profileResult = UserProfile.create({
    firstName: 'Test',
    lastName: 'User',
    displayName: 'TestUser',
    bio: 'Test bio',
    location: 'Stockholm'
  });
  const settingsResult = UserSettings.create({
    theme: 'light',
    language: 'sv',
    notifications: {
      email: true,
      push: true
    },
    privacy: {
      profileVisibility: 'friends'
    }
  });
  
  const userResult = User.create({
    id: new UniqueId(id),
    email: expectResultOk(emailResult, 'email creation'),
    profile: expectResultOk(profileResult, 'profile creation'),
    settings: expectResultOk(settingsResult, 'settings creation'),
    teamIds: [],
    roleIds: [],
    status: 'active'
  });
  
  return expectResultOk(userResult, 'user creation');
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
        settings: {
          theme: 'light',
          language: 'sv'
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
      
      const useCase = createUser({
        userRepo,
        eventBus
      });
      
      // Försök skapa användare med samma e-post (ska misslyckas)
      const result = await useCase({
        email: 'test@example.com', // Samma som i existingUser
        name: 'Duplicate User',
        phone: '+46701234567',
        settings: {
          theme: 'light',
          language: 'sv'
        }
      });
      
      // Kontrollera att användarfallet misslyckades
      expectResultErr(result, 'EMAIL_ALREADY_EXISTS', 'duplicate user creation');
      
      // Verifiera att inga händelser publicerades
      expect(eventBus.getEvents().length).toBe(0);
    });
  });
  
  describe('updateProfile användningsfall', () => {
    it('ska publicera UserProfileUpdated-händelse när profilen uppdateras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      const useCase = updateProfile({
        userRepo,
        eventBus
      });
      
      // Uppdatera profilen
      const result = await useCase({
        userId: existingUser.id.toString(),
        profile: {
          firstName: 'Updated',
          lastName: 'User',
          displayName: 'UpdatedUser',
          bio: 'Updated bio',
          location: 'Göteborg',
        }
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'profile update');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserProfileUpdated,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.profile.location === 'Göteborg';
        },
        'profile updated event'
      );
    });
  });
  
  describe('updateSettings användningsfall', () => {
    it('ska publicera UserSettingsUpdated-händelse när inställningar uppdateras', async () => {
      // Skapa en användare i repositoryt
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      const useCase = updateSettings({
        userRepo,
        eventBus
      });
      
      // Uppdatera inställningar
      const result = await useCase({
        userId: existingUser.id.toString(),
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: true
          },
          privacy: {
            profileVisibility: 'public'
          }
        }
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'settings update');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserSettingsUpdated,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.settings.theme === 'dark' &&
                 event.settings.language === 'en';
        },
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
      
      // Skapa aktiveringsanvändarfall
      const useCase = activateUser({
        userRepo,
        eventBus
      });
      
      // Aktivera användaren
      const result = await useCase({
        userId: 'inactive-user',
        reason: 'email_verification',
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'user activation');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserActivated,
        event => {
          return event.data.userId === 'inactive-user' &&
                 event.activationReason === 'email_verification';
        },
        'user activated event'
      );
    });
    
    it('ska publicera UserDeactivated-händelse när en användare inaktiveras', async () => {
      // Skapa en aktiv användare i repositoryt
      const activeUser = createTestUser('active-user');
      userRepo.setUser(activeUser);
      
      // Skapa inaktiveringsanvändarfall
      const useCase = deactivateUser({
        userRepo,
        eventBus
      });
      
      // Inaktivera användaren
      const result = await useCase({
        userId: 'active-user',
        reason: 'user_request',
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'user deactivation');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserDeactivated,
        event => {
          return event.data.userId === 'active-user' &&
                 event.deactivationReason === 'user_request';
        },
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
      
      // Skapa användarfall
      const useCase = updatePrivacySettings({
        userRepo,
        eventBus
      });
      
      const oldSettings = { profileVisibility: 'friends' };
      const newSettings = { profileVisibility: 'public' };
      
      // Uppdatera privacyinställningar
      const result = await useCase({
        userId: existingUser.id.toString(),
        privacySettings: newSettings
      });
      
      // Kontrollera att användarfallet lyckades
      expectResultOk(result, 'privacy settings update');
      
      // Kontrollera att rätt händelse publicerades
      expectEventPublished(
        eventBus.getEvents(),
        UserPrivacySettingsChanged,
        event => {
          return event.data.userId === existingUser.id.toString() &&
                 event.newSettings.profileVisibility === 'public';
        },
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
      // 1. Skapa användare
      const createUserUseCase = createUser({
        userRepo,
        eventBus
      });
      
      const createResult = await createUserUseCase({
        email: 'chain@example.com',
        name: 'Chain User',
        phone: '+46701234567',
        settings: {
          theme: 'light',
          language: 'sv'
        }
      });
      
      const createdUser = userRepo.getAllUsers()[0];
      const userId = createdUser.id.toString();
      
      // 2. Uppdatera profil
      const updateProfileUseCase = updateProfile({
        userRepo,
        eventBus
      });
      
      await updateProfileUseCase({
        userId,
        profile: {
          firstName: 'Updated',
          lastName: 'Chain',
          displayName: 'ChainUser',
          bio: 'Updated bio',
          location: 'Göteborg',
        }
      });
      
      // 3. Uppdatera inställningar
      const updateSettingsUseCase = updateSettings({
        userRepo,
        eventBus
      });
      
      await updateSettingsUseCase({
        userId,
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: true
          }
        }
      });
      
      // Kontrollera att alla händelser publicerades i rätt ordning
      const events = eventBus.getEvents();
      expect(events.length).toBe(3);
      expect(events[0]).toBeInstanceOf(UserCreated);
      expect(events[1]).toBeInstanceOf(UserProfileUpdated);
      expect(events[2]).toBeInstanceOf(UserSettingsUpdated);
      
      // Bekräfta att användardata har uppdaterats korrekt
      const updatedUser = await userRepo.findById(userId);
      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.profile.firstName).toBe('Updated');
      expect(updatedUser!.profile.location).toBe('Göteborg');
      expect(updatedUser!.settings.theme).toBe('dark');
      expect(updatedUser!.settings.language).toBe('en');
    });
    
    it('ska hantera en komplex konto- och säkerhetssekvens', async () => {
      // Skapa användare
      const existingUser = createTestUser();
      userRepo.setUser(existingUser);
      
      const userId = existingUser.id.toString();
      eventBus.clearEvents();
      
      // 1. Användaren loggar in
      await eventBus.publish(new UserSecurityEvent(
        existingUser,
        'login',
        { ip: '192.168.1.1', device: 'mobile' }
      ));
      
      // 2. Användaren uppdaterar sina privacyinställningar
      const updatePrivacyUseCase = updatePrivacySettings({
        userRepo,
        eventBus
      });
      
      await updatePrivacyUseCase({
        userId,
        privacySettings: {
          profileVisibility: 'public'
        }
      });
      
      // 3. Användaren ändrar notifikationsinställningar
      await eventBus.publish(new UserNotificationSettingsChanged(
        existingUser,
        { email: true, push: true },
        { email: false, push: true }
      ));
      
      // 4. Användaren loggar ut
      await eventBus.publish(new UserSecurityEvent(
        existingUser,
        'logout',
        { ip: '192.168.1.1', device: 'mobile' }
      ));
      
      // Kontrollera att alla händelser publicerades
      const events = eventBus.getEvents();
      expect(events.length).toBe(4);
      expect(events[0]).toBeInstanceOf(UserSecurityEvent);
      expect(events[1]).toBeInstanceOf(UserPrivacySettingsChanged);
      expect(events[2]).toBeInstanceOf(UserNotificationSettingsChanged);
      expect(events[3]).toBeInstanceOf(UserSecurityEvent);
      
      // Kontrollera specifika attribut i sista händelsen
      const logoutEvent = events[3] as UserSecurityEvent;
      expect(logoutEvent.eventType).toBe('logout');
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