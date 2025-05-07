import { Result } from '@/shared/core/Result';

export interface UserProfileProps {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  contact: {
    email: string;
    phone?: string;
    alternativeEmail?: string;
  };
  customFields?: Record<string, unknown>;
}

export class UserProfile {
  private constructor(
    private readonly props: {
      firstName: string;
      lastName: string;
      displayName: string | null;
      avatarUrl: string | null;
      bio: string | null;
      location: string | null;
      contact: {
        email: string;
        phone: string | null;
        alternativeEmail: string | null;
      };
      customFields: Record<string, unknown>;
    }
  ) {}

  public static create(props: UserProfileProps): Result<UserProfile> {
    // Validera obligatoriska fält
    if (!props.firstName?.trim()) {
      return Result.err('Förnamn kan inte vara tomt');
    }

    if (!props.lastName?.trim()) {
      return Result.err('Efternamn kan inte vara tomt');
    }

    // Trimma textfält
    const firstName = props.firstName.trim();
    const lastName = props.lastName.trim();
    const displayName = props.displayName?.trim() || null;
    const avatarUrl = props.avatarUrl?.trim() || null;
    const bio = props.bio?.trim() || null;
    const location = props.location?.trim() || null;

    // Hantera kontaktinformation
    const contact = {
      email: props.contact.email,
      phone: props.contact.phone || null,
      alternativeEmail: props.contact.alternativeEmail || null
    };

    // Hantera anpassade fält
    const customFields = props.customFields || {};

    return Result.ok(
      new UserProfile({
        firstName,
        lastName,
        displayName,
        avatarUrl,
        bio,
        location,
        contact,
        customFields
      })
    );
  }

  public get firstName(): string {
    return this.props.firstName;
  }

  public get lastName(): string {
    return this.props.lastName;
  }

  public get displayName(): string | null {
    return this.props.displayName;
  }

  public get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  public get bio(): string | null {
    return this.props.bio;
  }

  public get location(): string | null {
    return this.props.location;
  }

  public get contact(): {
    email: string;
    phone: string | null;
    alternativeEmail: string | null;
  } {
    return { ...this.props.contact };
  }

  public get customFields(): Record<string, unknown> {
    return { ...this.props.customFields };
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public update(patch: Partial<UserProfileProps>): Result<UserProfile> {
    return UserProfile.create({
      firstName: patch.firstName ?? this.firstName,
      lastName: patch.lastName ?? this.lastName,
      displayName: patch.displayName ?? this.displayName ?? undefined,
      avatarUrl: patch.avatarUrl ?? this.avatarUrl ?? undefined,
      bio: patch.bio ?? this.bio ?? undefined,
      location: patch.location ?? this.location ?? undefined,
      contact: {
        email: patch.contact?.email ?? this.contact.email,
        phone: patch.contact?.phone ?? this.contact.phone ?? undefined,
        alternativeEmail: patch.contact?.alternativeEmail ?? this.contact.alternativeEmail ?? undefined
      },
      customFields: {
        ...this.customFields,
        ...patch.customFields
      }
    });
  }
} 