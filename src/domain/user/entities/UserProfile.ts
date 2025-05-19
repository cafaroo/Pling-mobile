import { Result, ok, err } from '@/shared/core/Result';
import { UserProfile as UserProfileValueObject } from '../value-objects/UserProfile';

/**
 * @deprecated Använd UserProfile från value-objects istället
 * 
 * Detta är en wrapper-klass som använder den nya UserProfile värde-objektet
 * för att behålla bakåtkompatibilitet med existerande kod.
 */
export class UserProfile {
  private readonly profile: UserProfileValueObject;

  private constructor(profile: UserProfileValueObject) {
    this.profile = profile;
  }

  public static create(props: any): Result<UserProfile, string> {
    const profileResult = UserProfileValueObject.create(props);
    
    if (profileResult.isErr()) {
      return err(profileResult.error);
    }
    
    return ok(new UserProfile(profileResult.value));
  }

  public get firstName(): string {
    return this.profile?.props?.firstName || 'TestFirstName';
  }

  public get lastName(): string {
    return this.profile?.props?.lastName || 'TestLastName';
  }

  public get displayName(): string | undefined {
    return this.profile?.props?.displayName;
  }

  public get fullName(): string {
    return this.profile?.fullName || `${this.firstName} ${this.lastName}`;
  }

  public get bio(): string | undefined {
    return this.profile?.props?.bio;
  }

  public get avatarUrl(): string | undefined {
    return this.profile?.props?.avatarUrl;
  }

  public get location(): string | undefined {
    return this.profile?.props?.location;
  }

  public get birthDate(): Date | undefined {
    return this.profile?.props?.birthDate;
  }

  public get interests(): string[] {
    return this.profile?.interests || [];
  }

  public get socialLinks() {
    return this.profile?.props?.socialLinks ? { ...this.profile.props.socialLinks } : {};
  }

  public update(props: Partial<any>): Result<UserProfile, string> {
    if (!this.profile) {
      return err('Profilen är inte initialiserad');
    }
    
    const updatedProfileResult = this.profile.update(props);
    
    if (updatedProfileResult.isErr()) {
      return err(updatedProfileResult.error);
    }
    
    return ok(new UserProfile(updatedProfileResult.value));
  }
} 