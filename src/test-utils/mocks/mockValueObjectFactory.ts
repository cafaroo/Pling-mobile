import { Result } from '../../shared/core/Result';
import { Email } from '../../domain/user/value-objects/Email';
import { UserProfile } from '../../domain/user/value-objects/UserProfile';
import { UserSettings } from '../../domain/user/value-objects/UserSettings';
import { TeamName } from '../../domain/team/value-objects/TeamName';
import { TeamDescription } from '../../domain/team/value-objects/TeamDescription';
import { TeamSettings } from '../../domain/team/value-objects/TeamSettings';

/**
 * MockValueObjectFactory tillhandahåller standardiserade mockfunktioner för att skapa
 * värde-objekt som kan användas i tester.
 */
export class MockValueObjectFactory {
  /**
   * Skapar ett mock Email värde-objekt med standardvärden.
   * 
   * @param value - Email-strängen (standard: test@example.com)
   * @returns Result med Email-objektet
   */
  static createMockEmail(value: string = 'test@example.com'): Result<Email> {
    return Email.create(value);
  }

  /**
   * Skapar ett mock UserProfile värde-objekt med standardvärden.
   * 
   * @param props - Överskrivningsvärden för UserProfile
   * @returns Result med UserProfile-objektet
   */
  static createMockUserProfile(props: Partial<{
    bio: string;
    avatarUrl: string;
    phoneNumber: string;
    displayName: string;
  }> = {}): Result<UserProfile> {
    return UserProfile.create({
      bio: props.bio || 'Test bio',
      avatarUrl: props.avatarUrl || 'https://example.com/avatar.png',
      phoneNumber: props.phoneNumber || '+46701234567',
      displayName: props.displayName || 'Test User'
    });
  }

  /**
   * Skapar ett mock UserSettings värde-objekt med standardvärden.
   * 
   * @param props - Överskrivningsvärden för UserSettings
   * @returns Result med UserSettings-objektet
   */
  static createMockUserSettings(props: Partial<{
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
    privacy: {
      showEmail: boolean;
      showPhone: boolean;
      showProfile: boolean;
    };
    theme: string;
  }> = {}): Result<UserSettings> {
    return UserSettings.create({
      notifications: {
        email: props.notifications?.email ?? true,
        push: props.notifications?.push ?? true,
        desktop: props.notifications?.desktop ?? true
      },
      privacy: {
        showEmail: props.privacy?.showEmail ?? false,
        showPhone: props.privacy?.showPhone ?? false,
        showProfile: props.privacy?.showProfile ?? true
      },
      theme: props.theme || 'light'
    });
  }

  /**
   * Skapar ett mock TeamName värde-objekt med standardvärden.
   * 
   * @param value - TeamName-strängen (standard: Test Team)
   * @returns Result med TeamName-objektet
   */
  static createMockTeamName(value: string = 'Test Team'): Result<TeamName> {
    return TeamName.create(value);
  }

  /**
   * Skapar ett mock TeamDescription värde-objekt med standardvärden.
   * 
   * @param value - TeamDescription-strängen (standard: Test Team Description)
   * @returns Result med TeamDescription-objektet
   */
  static createMockTeamDescription(value: string = 'Test Team Description'): Result<TeamDescription> {
    return TeamDescription.create(value);
  }

  /**
   * Skapar ett mock TeamSettings värde-objekt med standardvärden.
   * 
   * @param props - Överskrivningsvärden för TeamSettings
   * @returns Result med TeamSettings-objektet
   */
  static createMockTeamSettings(props: Partial<{
    maxMembers: number;
    isPrivate: boolean;
    notificationSettings: {
      newMemberJoined: boolean;
      memberLeft: boolean;
      roleChanged: boolean;
    };
    communicationSettings: {
      allowDirectMessages: boolean;
      allowGroupChats: boolean;
    };
  }> = {}): Result<TeamSettings> {
    return TeamSettings.create({
      maxMembers: props.maxMembers ?? 10,
      isPrivate: props.isPrivate ?? false,
      notificationSettings: {
        newMemberJoined: props.notificationSettings?.newMemberJoined ?? true,
        memberLeft: props.notificationSettings?.memberLeft ?? true,
        roleChanged: props.notificationSettings?.roleChanged ?? true
      },
      communicationSettings: {
        allowDirectMessages: props.communicationSettings?.allowDirectMessages ?? true,
        allowGroupChats: props.communicationSettings?.allowGroupChats ?? true
      }
    });
  }

  /**
   * Skapar en array med mock TeamName värde-objekt.
   * 
   * @param count - Antal teamnamn att skapa
   * @param basePrefix - Prefix för alla teamnamn
   * @returns Array med TeamName-objekt
   */
  static createMockTeamNames(count: number, basePrefix: string = 'Test Team'): TeamName[] {
    return Array.from({ length: count }, (_, i) => {
      return this.createMockTeamName(`${basePrefix} ${i + 1}`).value;
    });
  }

  /**
   * Skapar en array med mock Email värde-objekt.
   * 
   * @param count - Antal email att skapa
   * @param domain - Domändelen av email-adresserna
   * @returns Array med Email-objekt
   */
  static createMockEmails(count: number, domain: string = 'example.com'): Email[] {
    return Array.from({ length: count }, (_, i) => {
      return this.createMockEmail(`user${i + 1}@${domain}`).value;
    });
  }
} 