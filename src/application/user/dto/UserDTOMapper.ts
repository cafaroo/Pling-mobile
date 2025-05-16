import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';
import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { UserSettings } from '@/domain/user/value-objects/UserSettings';

/**
 * DTOs för user-relaterade operationer i applikationslagret
 */

// CreateUserDTO används i CreateUserUseCase
export interface CreateUserDTO {
  email: string;
  phone?: string;
  password?: string; // För autentisering, hanteras normalt av auth-provider
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    socialLinks?: { [key: string]: string };
    interests?: string[];
  };
  settings: {
    theme?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
    privacy?: {
      showProfile?: boolean;
      showActivity?: boolean;
      showTeams?: boolean;
    };
  };
  teamIds?: string[];
  roleIds?: string[];
}

// UpdateProfileDTO används i UpdateProfileUseCase
export interface UpdateProfileDTO {
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  socialLinks?: { [key: string]: string };
  interests?: string[];
}

// UpdateSettingsDTO används i UpdateSettingsUseCase
export interface UpdateSettingsDTO {
  userId: string;
  theme?: string;
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  privacy?: {
    showProfile?: boolean;
    showActivity?: boolean;
    showTeams?: boolean;
  };
}

// ActivateUserDTO/DeactivateUserDTO används för aktivering/deaktivering av användare
export interface ChangeUserStatusDTO {
  userId: string;
  reason?: string;
}

// UserDTO används för presentation och överföring av User-entitet
export interface UserDTO {
  id: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    socialLinks?: { [key: string]: string };
    interests?: string[];
  };
  settings: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    privacy: {
      showProfile: boolean;
      showActivity: boolean;
      showTeams: boolean;
    };
  };
  teamIds: string[];
  roleIds: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserDTOMapper
 * 
 * Ansvarar för konvertering mellan domänmodell och DTOs i applikationslagret.
 */
export class UserDTOMapper {
  /**
   * Konverterar CreateUserDTO till domänmodell
   */
  static toUserFromCreateDTO(dto: CreateUserDTO): Result<User, string> {
    try {
      // Validera obligatoriska fält
      if (!dto.email || !dto.profile.firstName) {
        return err('Email and firstName are required');
      }

      // Validera e-post med värdobjekt
      const emailResult = Email.create(dto.email);
      if (emailResult.isErr()) {
        return err(`Invalid email: ${emailResult.error}`);
      }

      // Validera telefonnummer om det anges
      let phoneResult: Result<PhoneNumber, string> | undefined;
      if (dto.phone) {
        phoneResult = PhoneNumber.create(dto.phone);
        if (phoneResult.isErr()) {
          return err(`Invalid phone number: ${phoneResult.error}`);
        }
      }

      // Skapa UserProfile
      const profileResult = UserProfile.create({
        firstName: dto.profile.firstName,
        lastName: dto.profile.lastName,
        displayName: dto.profile.displayName || `${dto.profile.firstName} ${dto.profile.lastName}`,
        avatarUrl: dto.profile.avatarUrl,
        bio: dto.profile.bio || '',
        location: dto.profile.location || '',
        socialLinks: dto.profile.socialLinks || {},
        interests: dto.profile.interests || []
      });

      if (profileResult.isErr()) {
        return err(`Invalid profile: ${profileResult.error}`);
      }

      // Skapa UserSettings
      const settingsResult = UserSettings.create({
        theme: dto.settings.theme || 'light',
        language: dto.settings.language || 'sv',
        notifications: {
          email: dto.settings.notifications?.email ?? true,
          push: dto.settings.notifications?.push ?? true,
          inApp: dto.settings.notifications?.inApp ?? true
        },
        privacy: {
          showProfile: dto.settings.privacy?.showProfile ?? true,
          showActivity: dto.settings.privacy?.showActivity ?? true,
          showTeams: dto.settings.privacy?.showTeams ?? true
        }
      });

      if (settingsResult.isErr()) {
        return err(`Invalid settings: ${settingsResult.error}`);
      }

      // Skapa User-domänentitet
      const userResult = User.create({
        email: emailResult.value,
        phone: phoneResult?.value,
        profile: profileResult.value,
        settings: settingsResult.value,
        teamIds: dto.teamIds || [],
        roleIds: dto.roleIds || []
      });

      if (userResult.isErr()) {
        return err(`Failed to create user: ${userResult.error}`);
      }

      return ok(userResult.value);
    } catch (error) {
      return err(`Error in UserDTOMapper.toUserFromCreateDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar en User-domänmodell från UpdateProfileDTO
   */
  static updateProfileFromDTO(user: User, dto: UpdateProfileDTO): Result<User, string> {
    try {
      if (!dto.userId || dto.userId !== user.id.toString()) {
        return err('Invalid userId in update operation');
      }

      // Bygger det nya profilobjektet baserat på befintliga värden och dto
      const profileData = {
        firstName: dto.firstName ?? user.profile.firstName,
        lastName: dto.lastName ?? user.profile.lastName,
        displayName: dto.displayName ?? user.profile.displayName,
        avatarUrl: dto.avatarUrl ?? user.profile.avatarUrl,
        bio: dto.bio ?? user.profile.bio,
        location: dto.location ?? user.profile.location,
        socialLinks: dto.socialLinks ?? user.profile.socialLinks,
        interests: dto.interests ?? user.profile.interests
      };

      const profileResult = UserProfile.create(profileData);
      if (profileResult.isErr()) {
        return err(`Invalid profile data: ${profileResult.error}`);
      }

      // Uppdaterar användaren med den nya profilen
      const updateResult = user.updateProfile(profileResult.value);
      if (updateResult.isErr()) {
        return err(`Failed to update user profile: ${updateResult.error}`);
      }

      return ok(user);
    } catch (error) {
      return err(`Error in UserDTOMapper.updateProfileFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar en User-domänmodell från UpdateSettingsDTO
   */
  static updateSettingsFromDTO(user: User, dto: UpdateSettingsDTO): Result<User, string> {
    try {
      if (!dto.userId || dto.userId !== user.id.toString()) {
        return err('Invalid userId in update operation');
      }

      // Bygger det nya inställningsobjektet baserat på befintliga värden och dto
      const settingsData = {
        theme: dto.theme ?? user.settings.theme,
        language: dto.language ?? user.settings.language,
        notifications: {
          email: dto.notifications?.email ?? user.settings.notifications.email,
          push: dto.notifications?.push ?? user.settings.notifications.push,
          inApp: dto.notifications?.inApp ?? user.settings.notifications.inApp
        },
        privacy: {
          showProfile: dto.privacy?.showProfile ?? user.settings.privacy.showProfile,
          showActivity: dto.privacy?.showActivity ?? user.settings.privacy.showActivity,
          showTeams: dto.privacy?.showTeams ?? user.settings.privacy.showTeams
        }
      };

      const settingsResult = UserSettings.create(settingsData);
      if (settingsResult.isErr()) {
        return err(`Invalid settings data: ${settingsResult.error}`);
      }

      // Uppdaterar användaren med de nya inställningarna
      const updateResult = user.updateSettings(settingsResult.value);
      if (updateResult.isErr()) {
        return err(`Failed to update user settings: ${updateResult.error}`);
      }

      return ok(user);
    } catch (error) {
      return err(`Error in UserDTOMapper.updateSettingsFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar User-domänmodell till DTO för presentation
   */
  static toDTO(user: User): UserDTO {
    return {
      id: user.id.toString(),
      email: user.email,
      phone: user.phone,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        bio: user.profile.bio,
        location: user.profile.location,
        socialLinks: user.profile.socialLinks,
        interests: user.profile.interests
      },
      settings: {
        theme: user.settings.theme,
        language: user.settings.language,
        notifications: user.settings.notifications,
        privacy: user.settings.privacy
      },
      teamIds: user.teamIds,
      roleIds: user.roleIds,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Konverterar flera User-entiteter till DTOs
   */
  static toDTOList(users: User[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }
} 