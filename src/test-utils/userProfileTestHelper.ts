/**
 * Test-hjälpare för UserProfile
 * 
 * Denna fil innehåller hjälpfunktioner för att hantera UserProfile
 * som har refaktorerats från en enkel klass till ett ValueObject.
 */

import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { Result } from '@/shared/core/Result';
import { makeResultCompatible } from './resultTestHelper';

/**
 * Skapar ett mock UserProfile-objekt med standardvärden
 * 
 * @param overrides Värden att överskriva standardvärdena med
 * @returns Ett Result med UserProfile
 */
export function createMockUserProfile(overrides: Partial<{ 
  firstName: string;
  lastName: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  location?: string;
  website?: string;
}> = {}) {
  const defaults = {
    firstName: 'Test',
    lastName: 'User',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    phoneNumber: '+46701234567',
    location: 'Stockholm, Sweden',
    website: 'https://example.com'
  };

  const profileProps = { ...defaults, ...overrides };
  
  return makeResultCompatible(UserProfile.create({
    firstName: profileProps.firstName,
    lastName: profileProps.lastName,
    bio: profileProps.bio,
    avatarUrl: profileProps.avatarUrl,
    phoneNumber: profileProps.phoneNumber,
    location: profileProps.location,
    website: profileProps.website
  }));
}

/**
 * Skapa ett fördefinierat UserProfile-värdesobjekt för testning
 */
export const mockUserProfile = createMockUserProfile().value;

/**
 * Skapar ett objekt som beter sig som ett UserProfile för
 * bakåtkompatibilitet med tester som förväntar sig gamla UserProfile.
 * 
 * @param profile UserProfile värde-objekt
 * @returns En bakåtkompatibel representation av UserProfile
 */
export function createLegacyUserProfile(profile: UserProfile): any {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    phoneNumber: profile.phoneNumber,
    location: profile.location,
    website: profile.website,
    
    // För bakåtkompatibilitet, efterlikna gamla API:et
    get displayName() {
      return profile.fullName;
    },
    
    // Andra metoder från gamla UserProfile
    equals: (other: any) => profile.equals(other instanceof UserProfile ? other : profile),
    toString: () => profile.toString(),
    toJSON: () => profile.toValue()
  };
}

/**
 * När du behöver lägga till mock-metoder för UserProfile i tester
 * 
 * @param profile UserProfile att utöka med mock-metoder
 * @returns Samma UserProfile med ytterligare mock-metoder
 */
export function extendUserProfileWithMocks(profile: UserProfile): UserProfile & {
  update: jest.Mock;
  copyWith: jest.Mock;
} {
  // @ts-expect-error Vi lägger till properties dynamiskt
  profile.update = jest.fn().mockImplementation(data => {
    const updatedResult = UserProfile.create({
      ...profile.toValue(),
      ...data
    });
    return makeResultCompatible(updatedResult);
  });
  
  // @ts-expect-error Vi lägger till properties dynamiskt
  profile.copyWith = jest.fn().mockImplementation(data => {
    return UserProfile.create({
      ...profile.toValue(),
      ...data
    }).value;
  });
  
  return profile as UserProfile & {
    update: jest.Mock;
    copyWith: jest.Mock;
  };
} 