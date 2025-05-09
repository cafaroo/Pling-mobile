/**
 * Standardiserade testdata för användare
 * 
 * Använd dessa funktioner för att konsekvent skapa testanvändare i tester.
 * 
 * Exempel:
 * ```
 * import { createTestUser } from '@/test-utils/mocks/UserTestData';
 * 
 * const user = createTestUser();
 * ```
 */

import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';
import { UniqueId } from '@/shared/core/UniqueId';
import { mockResult } from './ResultMock';

/**
 * Standardvärden för testanvändare
 */
export const TEST_USER_DATA = {
  id: 'test-user-id',
  email: 'test@example.com',
  phone: '+46701234567',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'TestUser',
  bio: 'Test bio',
  location: 'Stockholm',
  theme: 'light',
  language: 'sv',
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
};

/**
 * Skapa ett kontaktobjekt för testanvändare
 */
export const createTestContact = (overrides = {}) => {
  return {
    email: TEST_USER_DATA.email,
    phone: TEST_USER_DATA.phone,
    alternativeEmail: null,
    ...overrides
  };
};

/**
 * Skapa ett UserProfile-objekt för testanvändare
 */
export const createTestUserProfile = (overrides = {}) => {
  const profileData = {
    firstName: TEST_USER_DATA.firstName,
    lastName: TEST_USER_DATA.lastName,
    displayName: TEST_USER_DATA.displayName,
    bio: TEST_USER_DATA.bio,
    location: TEST_USER_DATA.location,
    contact: createTestContact(),
    ...overrides
  };
  
  // Returnera ett mockad värdesobjekt
  return mockResult.ok({
    ...profileData,
    updateContact: jest.fn(),
    updateBio: jest.fn(),
    updateDisplayName: jest.fn(),
    update: jest.fn().mockReturnValue(mockResult.ok(profileData))
  });
};

/**
 * Skapa ett UserSettings-objekt för testanvändare
 */
export const createTestUserSettings = (overrides = {}) => {
  const settingsData = {
    theme: TEST_USER_DATA.theme,
    language: TEST_USER_DATA.language,
    notifications: TEST_USER_DATA.notifications,
    privacy: TEST_USER_DATA.privacy,
    ...overrides
  };
  
  // Returnera ett mockad värdesobjekt
  return mockResult.ok({
    ...settingsData,
    updateTheme: jest.fn(),
    updateLanguage: jest.fn(),
    updateNotifications: jest.fn(),
    updatePrivacy: jest.fn(),
    update: jest.fn().mockReturnValue(mockResult.ok(settingsData))
  });
};

/**
 * Skapa en DTO-representation av en testanvändare för API/databastester
 */
export const createTestUserDTO = (overrides = {}) => {
  return {
    id: TEST_USER_DATA.id,
    email: TEST_USER_DATA.email,
    phone: TEST_USER_DATA.phone,
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    profile: {
      firstName: TEST_USER_DATA.firstName,
      lastName: TEST_USER_DATA.lastName,
      displayName: TEST_USER_DATA.displayName,
      bio: TEST_USER_DATA.bio,
      location: TEST_USER_DATA.location,
      contact: {
        email: TEST_USER_DATA.email,
        phone: TEST_USER_DATA.phone,
        alternativeEmail: null
      }
    },
    settings: {
      theme: TEST_USER_DATA.theme,
      language: TEST_USER_DATA.language,
      notifications: TEST_USER_DATA.notifications,
      privacy: TEST_USER_DATA.privacy
    },
    team_ids: [],
    role_ids: [],
    status: 'active',
    ...overrides
  };
};

/**
 * Skapar en mock User-instans direkt med korrekta värden
 * för användning i tester istället för att anropa den asynkrona factory-metoden
 */
export const createTestUser = (id: string = TEST_USER_DATA.id): User => {
  // Skapa ett UserProfile
  const profile = new UserProfile({
    firstName: 'Test',
    lastName: 'User',
    displayName: 'TestUser',
    bio: 'Test bio',
    location: 'Stockholm',
    contact: {
      email: 'test@example.com',
      phone: '+46701234567',
      alternativeEmail: null
    }
  });
  
  // Skapa UserSettings
  const settings = new UserSettings({
    theme: 'light',
    language: 'sv',
    notifications: { 
      enabled: true, 
      frequency: 'daily',
      emailEnabled: true,
      pushEnabled: true
    },
    privacy: { 
      profileVisibility: 'public',
      showOnlineStatus: true,
      showLastSeen: true
    }
  });
  
  // Skapa en UserProps-liknande struktur
  const userProps = {
    id: new UniqueId(id),
    email: 'test@example.com',
    name: 'Test User',
    profile: profile,
    settings: settings,
    teamIds: [],
    roleIds: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Skapa ett User-objekt direkt som en instans
  // @ts-ignore - Vi tvingar fram konstruktörn som är privat
  return new User(userProps);
};

/**
 * Skapar testdata för en användarlista med flera användare
 */
export const createTestUsers = (count: number = 5): User[] => {
  return Array.from({ length: count }, (_, i) => 
    createTestUser(`test-id-${i + 1}`)
  );
}; 