/**
 * Integrationstester mellan applikationslager och infrastrukturlager för användardomänen
 * 
 * Dessa tester simulerar ett flöde där applikationslagets användarfall integrerar
 * med infrastrukturlagret (repositories) med en mock-server för att testa 
 * fullständiga operationer utan att använda UI-lagret.
 */

import { createUser } from '../useCases/createUser';
import { updateProfile } from '../useCases/updateProfile';
import { updateSettings } from '../useCases/updateSettings';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/events/EventBus';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { Email } from '@/domain/user/value-objects/Email';

// En testrepository för infrastrukturlagret som simulerar en databas
class MockUserRepository implements UserRepository {
  private users: Map<string, any> = new Map();
  private profiles: Map<string, any> = new Map();
  private settings: Map<string, any> = new Map();
  
  // Simulera nätverksfördröjning och potentiella fel
  private shouldSimulateError: boolean = false;
  private networkDelay: number = 50;

  constructor(
    simulateError = false,
    networkDelay = 50
  ) {
    this.shouldSimulateError = simulateError;
    this.networkDelay = networkDelay;
  }

  async findById(id: string): Promise<User | null> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }
    
    const userData = this.users.get(id);
    if (!userData) return null;
    
    return this.mapToUserEntity(userData);
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }

    // Hitta användare med angiven e-post
    for (const userData of this.users.values()) {
      if (userData.email === email) {
        return this.mapToUserEntity(userData);
      }
    }
    
    return null;
  }

  async save(user: User): Promise<boolean> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }

    // Lagra användardata
    const userData = {
      id: user.id.toString(),
      email: user.email.value,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        location: user.profile.location,
      },
      settings: {
        theme: user.settings.theme,
        language: user.settings.language,
        notifications: user.settings.notifications,
        privacy: user.settings.privacy,
      }
    };
    
    this.users.set(user.id.toString(), userData);
    this.profiles.set(user.id.toString(), userData.profile);
    this.settings.set(user.id.toString(), userData.settings);
    
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }
    
    this.users.delete(id);
    this.profiles.delete(id);
    this.settings.delete(id);
    
    return true;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }
    
    const profileData = this.profiles.get(userId);
    if (!profileData) return null;
    
    return UserProfile.create({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      displayName: profileData.displayName,
      bio: profileData.bio,
      location: profileData.location,
    }).unwrap();
  }

  async getSettings(userId: string): Promise<UserSettings | null> {
    await this.simulateNetwork();
    
    if (this.shouldSimulateError) {
      throw new Error("Simulated database error");
    }
    
    const settingsData = this.settings.get(userId);
    if (!settingsData) return null;
    
    return UserSettings.create({
      theme: settingsData.theme,
      language: settingsData.language,
      notifications: settingsData.notifications,
      privacy: settingsData.privacy,
    }).unwrap();
  }

  // Hjälpmetoder
  private async simulateNetwork(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.networkDelay));
  }

  private mapToUserEntity(userData: any): User {
    const profileResult = UserProfile.create({
      firstName: userData.profile.firstName,
      lastName: userData.profile.lastName,
      displayName: userData.profile.displayName,
      bio: userData.profile.bio,
      location: userData.profile.location,
    });

    const settingsResult = UserSettings.create({
      theme: userData.settings.theme,
      language: userData.settings.language,
      notifications: userData.settings.notifications,
      privacy: userData.settings.privacy,
    });

    const emailResult = Email.create(userData.email);
    
    return User.create({
      id: new UniqueId(userData.id),
      email: emailResult.unwrap(),
      profile: profileResult.unwrap(),
      settings: settingsResult.unwrap(),
      teamIds: [],
      roleIds: [],
      status: 'active'
    }).unwrap();
  }

  // Testhjälpmetoder
  setSimulateError(shouldError: boolean): void {
    this.shouldSimulateError = shouldError;
  }

  setNetworkDelay(delay: number): void {
    this.networkDelay = delay;
  }

  getRepository(): Map<string, any> {
    return this.users;
  }
}

// Mock-implementation av EventBus för testning
class MockEventBus implements EventBus {
  private events: any[] = [];

  async publish(event: any): Promise<void> {
    this.events.push(event);
  }

  subscribe(eventType: any, callback: (event: any) => void): { unsubscribe: () => void } {
    return {
      unsubscribe: () => {}
    };
  }

  // Testhjälpmetoder
  getPublishedEvents(): any[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}

describe('Användardomän - Integrationstester', () => {
  let userRepository: MockUserRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    eventBus = new MockEventBus();
  });

  describe('Skapa användare → Uppdatera profil → Uppdatera inställningar', () => {
    it('ska utföra hela användarflödet framgångsrikt', async () => {
      // STEG 1: Skapa användare
      const createUserUseCase = createUser({ 
        userRepo: userRepository, 
        eventBus 
      });

      const createUserResult = await createUserUseCase({
        email: 'test@example.com',
        name: 'Test User',
        phone: '+46701234567',
        settings: {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true,
            push: true,
            sms: false,
            frequency: 'daily'
          }
        }
      });

      expect(createUserResult.isOk()).toBe(true);
      
      // Hämta skapad användare
      const createdUser = await userRepository.findByEmail('test@example.com');
      expect(createdUser).not.toBeNull();
      const userId = createdUser!.id.toString();
      
      // STEG 2: Uppdatera profil
      const updateProfileUseCase = updateProfile({
        userRepo: userRepository,
        eventBus
      });

      const updateProfileResult = await updateProfileUseCase({
        userId,
        profile: {
          firstName: 'Updated',
          lastName: 'User',
          displayName: 'UpdatedUser',
          bio: 'Updated bio',
          location: 'Göteborg',
        }
      });
      
      expect(updateProfileResult.isOk()).toBe(true);
      
      // Hämta uppdaterad användare
      const updatedUser = await userRepository.findById(userId);
      expect(updatedUser?.profile.firstName).toBe('Updated');
      expect(updatedUser?.profile.location).toBe('Göteborg');
      
      // STEG 3: Uppdatera inställningar
      const updateSettingsUseCase = updateSettings({
        userRepo: userRepository,
        eventBus
      });

      const updateSettingsResult = await updateSettingsUseCase({
        userId,
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: true,
            sms: true,
            frequency: 'weekly'
          },
          privacy: {
            profileVisibility: 'public',
            activityVisibility: 'friends'
          }
        }
      });
      
      expect(updateSettingsResult.isOk()).toBe(true);
      
      // Hämta uppdaterad användare med nya inställningar
      const userWithUpdatedSettings = await userRepository.findById(userId);
      expect(userWithUpdatedSettings?.settings.theme).toBe('dark');
      expect(userWithUpdatedSettings?.settings.language).toBe('en');
      expect(userWithUpdatedSettings?.settings.notifications.frequency).toBe('weekly');
      
      // Verifiera att domänhändelser har publicerats
      const events = eventBus.getPublishedEvents();
      expect(events.length).toBeGreaterThanOrEqual(3); // Minst en händelse per operation
    });

    it('ska hantera databasfel korrekt i flödet', async () => {
      // STEG 1: Skapa användare
      const createUserUseCase = createUser({ 
        userRepo: userRepository, 
        eventBus 
      });

      const createUserResult = await createUserUseCase({
        email: 'test@example.com',
        name: 'Test User',
        phone: '+46701234567',
        settings: {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true,
            push: true
          }
        }
      });

      expect(createUserResult.isOk()).toBe(true);
      
      const createdUser = await userRepository.findByEmail('test@example.com');
      const userId = createdUser!.id.toString();
      
      // STEG 2: Simulera databaserror vid profiluppdatering
      userRepository.setSimulateError(true);
      
      const updateProfileUseCase = updateProfile({
        userRepo: userRepository,
        eventBus
      });

      // Använd try-catch för att testa felhanteringen
      try {
        await updateProfileUseCase({
          userId,
          profile: {
            firstName: 'Updated',
            lastName: 'User',
            displayName: 'UpdatedUser',
            bio: 'Updated bio',
            location: 'Göteborg',
          }
        });
        
        // Om vi kommer hit har inget fel kastats, vilket är fel
        fail('Expected an error but none was thrown');
      } catch (error: any) {
        // Verifiera att rätt fel har fångats
        expect(error.message).toContain('Simulated database error');
      }
      
      // Återställ normal funktion
      userRepository.setSimulateError(false);
      
      // Verifiera att originaldata fortfarande finns kvar
      const unchangedUser = await userRepository.findById(userId);
      expect(unchangedUser?.profile.firstName).not.toBe('Updated');
    });
  });

  describe('Prestanda och timeouts', () => {
    it('ska hantera långsamma nätverkssvar', async () => {
      // Öka nätverksfördröjningen
      userRepository.setNetworkDelay(500);
      
      const createUserUseCase = createUser({ 
        userRepo: userRepository, 
        eventBus 
      });

      // Sätt en timeout för testet
      jest.setTimeout(2000);

      const startTime = Date.now();
      const createUserResult = await createUserUseCase({
        email: 'slow@example.com',
        name: 'Slow User',
        phone: '+46707654321',
        settings: {
          theme: 'dark',
          language: 'sv'
        }
      });
      const endTime = Date.now();
      
      expect(createUserResult.isOk()).toBe(true);
      
      // Verifiera att det tog minst 500ms (vår simulerade fördröjning)
      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
      
      // Återställ timeout
      jest.setTimeout(5000);
    });
  });
}); 