import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

// Interface för användarens DTO i databasen
export interface UserDTO {
  id: string;
  email: string;
  name?: string;
  phone?: string | null;
  settings?: {
    theme?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      frequency?: string;
    };
    privacy?: {
      profileVisibility?: string;
      showEmail?: boolean;
      showPhone?: boolean;
    };
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
    location?: string;
    contact?: {
      email?: string;
      phone?: string | null;
    };
  };
  created_at?: string;
  updated_at?: string;
}

// Mapper-klass för att konvertera mellan DTO och domänmodell
export class UserMapper {
  // Konvertera DTO till domänentitet
  static toDomain(dto: UserDTO): Result<User, string> {
    try {
      // Validera e-post
      const emailResult = Email.create(dto.email);
      if (emailResult.isErr()) {
        return err(`Ogiltig e-post: ${emailResult.error}`);
      }
      
      // Validera telefonnummer om det finns
      let phone = null;
      if (dto.phone) {
        const phoneResult = PhoneNumber.create(dto.phone);
        if (phoneResult.isErr()) {
          return err(`Ogiltigt telefonnummer: ${phoneResult.error}`);
        }
        phone = phoneResult.getValue();
      }
      
      // Skapa profil med standardvärden om de saknas
      const profile = dto.profile || {};
      const profileResult = UserProfile.create({
        firstName: profile.firstName || 'Förnamn',
        lastName: profile.lastName || 'Efternamn',
        displayName: profile.displayName || 'Användare',
        bio: profile.bio || '',
        location: profile.location || '',
        contact: profile.contact || {
          email: dto.email,
          phone: dto.phone,
          alternativeEmail: null
        }
      });
      
      if (profileResult.isErr()) {
        return err(`Ogiltig profil: ${profileResult.error}`);
      }
      
      // Skapa inställningar med standardvärden om de saknas
      const settings = dto.settings || {};
      const settingsResult = UserSettings.create({
        theme: settings.theme || 'light',
        language: settings.language || 'sv',
        notifications: settings.notifications || {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily'
        },
        privacy: settings.privacy || {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      });
      
      if (settingsResult.isErr()) {
        return err(`Ogiltiga inställningar: ${settingsResult.error}`);
      }
      
      // Skapa användarentitet
      const userResult = User.create({
        id: new UniqueId(dto.id),
        email: emailResult.getValue(),
        name: dto.name || `${profile.firstName || 'Förnamn'} ${profile.lastName || 'Efternamn'}`,
        phone,
        profile: profileResult.getValue(),
        settings: settingsResult.getValue(),
        teamIds: [],
        roleIds: [],
        status: 'active'
      });
      
      if (userResult.isErr()) {
        return err(`Kunde inte skapa användare: ${userResult.error}`);
      }
      
      return ok(userResult.getValue());
    } catch (error) {
      return err(`Oväntat fel vid mappning: ${error}`);
    }
  }
  
  // Konvertera domänentitet till DTO för datalagring
  static toPersistence(user: User): UserDTO {
    return {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name,
      phone: user.phone ? user.phone.toString() : null,
      settings: user.settings ? {
        theme: user.settings.theme,
        language: user.settings.language,
        notifications: user.settings.notifications,
        privacy: user.settings.privacy
      } : undefined,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        location: user.profile.location,
        contact: user.profile.contact
      } : undefined,
      created_at: user.createdAt?.toISOString(),
      updated_at: user.updatedAt?.toISOString()
    };
  }
  
  // Konvertera domänentitet till DTO för API (utesluter känslig information)
  static toDTO(user: User): UserDTO {
    const dto = this.toPersistence(user);
    
    // Ta bort känslig information
    if (dto.settings && 'secretKey' in dto.settings) {
      const { secretKey, ...safeSettings } = dto.settings as any;
      dto.settings = safeSettings;
    }
    
    return dto;
  }
} 