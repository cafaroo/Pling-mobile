import { Result, ok, err } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UniqueId } from '@/shared/core/UniqueId';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';

// Data Transfer Object för användare
export interface UserDTO {
  id: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    bio?: string;
    location?: string;
    contact?: {
      email: string;
      phone?: string;
      alternativeEmail?: string | null;
    };
  };
  settings: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms?: boolean;
    };
    privacy: {
      profileVisibility: string;
      allowSearchByEmail?: boolean;
      showOnlineStatus?: boolean;
      showLastSeen?: boolean;
    };
  };
  team_ids?: string[];
  role_ids?: string[];
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Konvertera ett DTO till en domänmodell
export const toUser = (dto: UserDTO): Result<User, string> => {
  try {
    // Validera e-post
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      return err(`Ogiltig e-post: ${emailResult.error}`);
    }
    
    // Validera telefonnummer om det finns
    let phone = undefined;
    if (dto.phone) {
      const phoneResult = PhoneNumber.create(dto.phone);
      if (phoneResult.isErr()) {
        return err(`Ogiltigt telefonnummer: ${phoneResult.error}`);
      }
      phone = phoneResult.getValue();
    }
    
    // Skapa profil
    const profileResult = UserProfile.create({
      firstName: dto.profile.firstName,
      lastName: dto.profile.lastName,
      displayName: dto.profile.displayName,
      bio: dto.profile.bio || '',
      location: dto.profile.location || '',
      contact: dto.profile.contact || {
        email: dto.email,
        phone: dto.phone,
        alternativeEmail: null
      }
    });
    
    if (profileResult.isErr()) {
      return err(`Ogiltig profil: ${profileResult.error}`);
    }
    
    // Skapa inställningar
    const settingsResult = UserSettings.create({
      theme: dto.settings.theme,
      language: dto.settings.language,
      notifications: dto.settings.notifications,
      privacy: dto.settings.privacy
    });
    
    if (settingsResult.isErr()) {
      return err(`Ogiltiga inställningar: ${settingsResult.error}`);
    }
    
    // Skapa användarentitet
    const userResult = User.create({
      id: new UniqueId(dto.id),
      email: emailResult.getValue(),
      phone,
      profile: profileResult.getValue(),
      settings: settingsResult.getValue(),
      teamIds: (dto.team_ids || []).map(id => new UniqueId(id)),
      roleIds: (dto.role_ids || []).map(id => new UniqueId(id)),
      status: dto.status || 'active'
    });
    
    if (userResult.isErr()) {
      return err(`Ogiltig användare: ${userResult.error}`);
    }
    
    return ok(userResult.getValue());
  } catch (error) {
    return err(`Fel vid konvertering av användare: ${error.message}`);
  }
};

// Konvertera en domänmodell till ett DTO
export const toDTO = (user: User): UserDTO => {
  return {
    id: user.id.toString(),
    email: user.email.value,
    phone: user.phone?.value,
    profile: {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      location: user.profile.location,
      contact: {
        email: user.profile.contact.email,
        phone: user.profile.contact.phone,
        alternativeEmail: user.profile.contact.alternativeEmail
      }
    },
    settings: {
      theme: user.settings.theme,
      language: user.settings.language,
      notifications: user.settings.notifications,
      privacy: user.settings.privacy
    },
    team_ids: user.teamIds.map(id => id.toString()),
    role_ids: user.roleIds.map(id => id.toString()),
    status: user.status
  };
}; 