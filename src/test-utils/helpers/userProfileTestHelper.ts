/**
 * UserProfileTestHelper
 * 
 * Hjälpfunktioner för att skapa och testa UserProfile-objekt
 */

import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { Result } from '@/shared/core/Result';

export class UserProfileTestHelper {
  /**
   * Skapa ett giltigt UserProfile-objekt för testning
   */
  static createValidProfile(overrides: Partial<any> = {}): Result<UserProfile, string> {
    return UserProfile.create({
      firstName: 'Test',
      lastName: 'Användare',
      displayName: 'TestAnvändare',
      bio: 'Test bio',
      avatar: 'https://example.com/avatar.jpg',
      ...overrides
    });
  }

  /**
   * Skapa ett ogiltigt UserProfile-objekt för testning av felhantering
   */
  static createInvalidProfile(): Result<UserProfile, string> {
    return UserProfile.create({
      firstName: '', // För kort
      lastName: '', // För kort
      displayName: '', // För kort
      bio: new Array(1001).join('a') // För långt (max 500 tecken)
    });
  }

  /**
   * Jämför två UserProfile-objekt och returnera true om de är likvärdiga
   */
  static areEqual(profile1: UserProfile, profile2: UserProfile): boolean {
    return (
      profile1.firstName === profile2.firstName &&
      profile1.lastName === profile2.lastName &&
      profile1.displayName === profile2.displayName &&
      profile1.bio === profile2.bio &&
      profile1.avatar === profile2.avatar
    );
  }

  /**
   * Skapa ett profilobjekt för testning som har alla fält satta
   */
  static createFullProfile(): Result<UserProfile, string> {
    return UserProfile.create({
      firstName: 'Test',
      lastName: 'Användare',
      displayName: 'TestAnvändare',
      bio: 'Detta är en testbio för testanvändare',
      avatar: 'https://example.com/avatar.jpg',
      location: 'Stockholm, Sverige',
      website: 'https://example.com',
      company: 'TestFöretag AB',
      title: 'Testare'
    });
  }

  /**
   * Skapa ett minimalt profilobjekt för testning
   */
  static createMinimalProfile(): Result<UserProfile, string> {
    return UserProfile.create({
      firstName: 'Test',
      lastName: 'User'
    });
  }
} 