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
  bio: 'Bio för testanvändare',
  location: 'Stockholm',
  theme: 'dark',
  language: 'sv',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    profileVisibility: 'public',
    allowSearchByEmail: true
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
 * Skapa ett komplett User-objekt för tester med alla nödvändiga värden
 */
export const createTestUser = (overrides = {}) => {
  const userData = {
    id: new UniqueId(TEST_USER_DATA.id),
    email: Email.create(TEST_USER_DATA.email).getValue(),
    phone: PhoneNumber.create(TEST_USER_DATA.phone).getValue(),
    profile: createTestUserProfile().getValue(),
    settings: createTestUserSettings().getValue(),
    teamIds: [],
    roleIds: [],
    status: 'active',
    ...overrides
  };
  
  // Returnera ett mockad User-objekt
  return mockResult.ok({
    ...userData,
    updateProfile: jest.fn().mockReturnValue(mockResult.ok(userData)),
    updateSettings: jest.fn().mockReturnValue(mockResult.ok(userData)),
    addTeam: jest.fn(),
    removeTeam: jest.fn(),
    addRole: jest.fn(),
    removeRole: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    domainEvents: [],
    clearDomainEvents: jest.fn()
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