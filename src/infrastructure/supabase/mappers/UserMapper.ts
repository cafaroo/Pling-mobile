import { Result, ok, err } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UniqueId } from '@/shared/core/UniqueId';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';

/**
 * DTO från Supabase-databasen
 */
export interface UserDTO {
  id: string;
  email: string;
  phone?: string;
  profile?: {
    firstName: string;
    lastName: string;
    displayName?: string;
    bio?: string;
    location?: string;
    contact?: {
      email?: string;
      phone?: string;
      alternativeEmail?: string | null;
    };
  };
  settings?: {
    theme?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      profileVisibility?: string;
      allowSearchByEmail?: boolean;
      showOnlineStatus?: boolean;
      showLastSeen?: boolean;
    };
  };
  team_ids?: string[];
  role_ids?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * UserMapper
 * 
 * Ansvarar för konvertering mellan domänobjekt och databasformat.
 * Följer DDD-principer genom att hantera mappning och konvertering.
 */
export class UserMapper {
  /**
   * Konverterar UserDTO från databas till domänmodell
   */
  static toDomain(dto: UserDTO): Result<User, string> {
    try {
      // Validera basdata
      if (!dto.id || !dto.email) {
        return err('Ofullständig användardata från databasen');
      }

      // Validera e-post
      const emailResult = Email.create(dto.email);
      if (emailResult.isErr()) {
        return err(`Ogiltig e-post: ${emailResult.error}`);
      }
      
      // Validera telefonnummer om det finns
      let phoneResult = undefined;
      if (dto.phone) {
        phoneResult = PhoneNumber.create(dto.phone);
        if (phoneResult.isErr()) {
          return err(`Ogiltigt telefonnummer: ${phoneResult.error}`);
        }
      }

      // Skapa profil
      const profileResult = dto.profile 
        ? UserProfile.create({
            firstName: dto.profile.firstName,
            lastName: dto.profile.lastName,
            displayName: dto.profile.displayName || `${dto.profile.firstName} ${dto.profile.lastName}`,
            bio: dto.profile.bio || '',
            location: dto.profile.location || '',
            contact: dto.profile.contact || {
              email: dto.email,
              phone: dto.phone,
              alternativeEmail: null
            }
          })
        : UserProfile.create({
            firstName: 'Användare',
            lastName: '',
            displayName: 'Användare',
            bio: '',
            location: '',
            contact: {
              email: dto.email,
              phone: dto.phone,
              alternativeEmail: null
            }
          });
      
      if (profileResult.isErr()) {
        return err(`Ogiltig profil: ${profileResult.error}`);
      }
      
      // Skapa inställningar
      const defaultSettings = {
        theme: 'light',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          allowSearchByEmail: true,
          showOnlineStatus: true,
          showLastSeen: true
        }
      };

      const settingsData = dto.settings || defaultSettings;
      const settingsResult = UserSettings.create({
        theme: settingsData.theme || defaultSettings.theme,
        language: settingsData.language || defaultSettings.language,
        notifications: {
          ...defaultSettings.notifications,
          ...settingsData.notifications
        },
        privacy: {
          ...defaultSettings.privacy,
          ...settingsData.privacy
        }
      });
      
      if (settingsResult.isErr()) {
        return err(`Ogiltiga inställningar: ${settingsResult.error}`);
      }

      // Skapa användarentitet
      const user = new User({
        id: new UniqueId(dto.id),
        email: emailResult.value.value,
        phone: phoneResult ? phoneResult.value.value : undefined,
        profile: profileResult.value,
        settings: settingsResult.value,
        teamIds: dto.team_ids || [],
        roleIds: dto.role_ids || [],
        status: (dto.status as any) || 'active',
        createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
        updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date()
      });
      
      return ok(user);
    } catch (error) {
      return err(`UserMapper.toDomain fel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar User-domänmodell till databasobjekt
   */
  static toPersistence(user: User): UserDTO {
    try {
      return {
        id: user.id.toString(),
        email: user.email,
        phone: user.phone,
        profile: user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          location: user.profile.location,
          contact: {
            email: user.profile.contact?.email || user.email,
            phone: user.profile.contact?.phone,
            alternativeEmail: user.profile.contact?.alternativeEmail
          }
        } : undefined,
        settings: {
          theme: user.settings.theme,
          language: user.settings.language,
          notifications: user.settings.notifications,
          privacy: user.settings.privacy
        },
        team_ids: user.teamIds,
        role_ids: user.roleIds,
        status: user.status,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString()
      };
    } catch (error) {
      console.error(`UserMapper.toPersistence fel: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
} 