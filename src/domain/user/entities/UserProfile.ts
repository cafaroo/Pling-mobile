import { Result, ok, err } from '@/shared/core/Result';

export interface UserProfileProps {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  birthDate?: Date;
  interests?: string[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export class UserProfile {
  private readonly props: UserProfileProps;

  private constructor(props: UserProfileProps) {
    this.props = props;
  }

  public static create(props: UserProfileProps): Result<UserProfile, string> {
    if (!props.firstName || props.firstName.trim().length < 1) {
      return err('Förnamn är obligatoriskt');
    }

    if (!props.lastName || props.lastName.trim().length < 1) {
      return err('Efternamn är obligatoriskt');
    }

    if (props.displayName && props.displayName.trim().length < 2) {
      return err('Visningsnamn måste vara minst 2 tecken');
    }

    if (props.bio && props.bio.length > 500) {
      return err('Bio får inte vara längre än 500 tecken');
    }

    if (props.interests && props.interests.length > 10) {
      return err('Max 10 intressen är tillåtna');
    }

    if (props.birthDate && props.birthDate > new Date()) {
      return err('Födelsedatum kan inte vara i framtiden');
    }

    // Validera URL-format för sociala länkar
    const urlPattern = /^https?:\/\/.+/;
    if (props.socialLinks) {
      for (const [platform, url] of Object.entries(props.socialLinks)) {
        if (url && !urlPattern.test(url)) {
          return err(`Ogiltig URL för ${platform}`);
        }
      }
    }

    return ok(new UserProfile({
      ...props,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      displayName: props.displayName?.trim(),
      bio: props.bio?.trim()
    }));
  }

  public get firstName(): string {
    return this.props.firstName;
  }

  public get lastName(): string {
    return this.props.lastName;
  }

  public get displayName(): string | undefined {
    return this.props.displayName;
  }

  public get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  public get bio(): string | undefined {
    return this.props.bio;
  }

  public get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  public get location(): string | undefined {
    return this.props.location;
  }

  public get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  public get interests(): string[] {
    return this.props.interests || [];
  }

  public get socialLinks() {
    return { ...this.props.socialLinks };
  }

  public update(profile: Partial<UserProfileProps>): Result<UserProfile, string> {
    return UserProfile.create({
      ...this.props,
      ...profile
    });
  }
} 