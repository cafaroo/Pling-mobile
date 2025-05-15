import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

export interface SocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
}

export interface UserProfileProps {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  birthDate?: Date;
  interests?: string[];
  socialLinks?: SocialLinks;
}

/**
 * UserProfile värde-objekt
 * 
 * Ett värde-objekt som representerar en användares profil med valideringsregler.
 */
export class UserProfile extends ValueObject<UserProfileProps> {
  private static readonly MIN_NAME_LENGTH = 1;
  private static readonly MIN_DISPLAY_NAME_LENGTH = 2;
  private static readonly MAX_BIO_LENGTH = 500;
  private static readonly MAX_INTERESTS = 10;
  private static readonly URL_PATTERN = /^https?:\/\/.+/;
  
  private constructor(props: UserProfileProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt UserProfile-objekt
   * @param props UserProfile-egenskaper
   * @returns Result med UserProfile eller felmeddelande
   */
  public static create(props: UserProfileProps): Result<UserProfile, string> {
    // Förbehandla strängfält
    const processedProps = {
      ...props,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      displayName: props.displayName?.trim(),
      bio: props.bio?.trim(),
      location: props.location?.trim(),
      interests: props.interests ? [...props.interests] : [],
      socialLinks: props.socialLinks ? { ...props.socialLinks } : undefined
    };
    
    // Validera egenskaper
    const validations: Array<[boolean, string]> = [
      [processedProps.firstName.length >= this.MIN_NAME_LENGTH, 'Förnamn är obligatoriskt'],
      [processedProps.lastName.length >= this.MIN_NAME_LENGTH, 'Efternamn är obligatoriskt'],
      [!processedProps.displayName || processedProps.displayName.length >= this.MIN_DISPLAY_NAME_LENGTH, 'Visningsnamn måste vara minst 2 tecken'],
      [!processedProps.bio || processedProps.bio.length <= this.MAX_BIO_LENGTH, 'Bio får inte vara längre än 500 tecken'],
      [!processedProps.interests || processedProps.interests.length <= this.MAX_INTERESTS, 'Max 10 intressen är tillåtna'],
      [!processedProps.birthDate || processedProps.birthDate <= new Date(), 'Födelsedatum kan inte vara i framtiden']
    ];
    
    // Validera URLs
    if (processedProps.socialLinks) {
      for (const [platform, url] of Object.entries(processedProps.socialLinks)) {
        if (url && !this.URL_PATTERN.test(url)) {
          return err(`Ogiltig URL för ${platform}`);
        }
      }
    }
    
    const validation = this.validate<UserProfileProps>(processedProps, validations);
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    return ok(new UserProfile(processedProps));
  }
  
  /**
   * Returnerar användarens fullständiga namn
   */
  public get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
  
  /**
   * Gör en djup kopia med uppdaterade egenskaper
   * @param props Egenskaper att uppdatera
   * @returns Ett nytt UserProfile-värde-objekt
   */
  public copyWith(props: Partial<UserProfileProps>): Result<UserProfile, string> {
    return UserProfile.create({
      ...this.props,
      ...props
    });
  }
  
  /**
   * Uppdaterar och returnerar en ny UserProfile med ändrade värden
   * @param updatedProps Egenskaper att uppdatera
   * @returns Result med uppdaterad UserProfile eller felmeddelande
   */
  public update(updatedProps: Partial<UserProfileProps>): Result<UserProfile, string> {
    return this.copyWith(updatedProps);
  }
  
  /**
   * Kontrollerar om användaren har en profilbild
   */
  public hasAvatar(): boolean {
    return !!this.props.avatarUrl;
  }
  
  /**
   * Kontrollerar om användaren har en bio
   */
  public hasBio(): boolean {
    return !!this.props.bio && this.props.bio.length > 0;
  }
  
  /**
   * Returnerar användarens intressen eller en tom array
   */
  public get interests(): string[] {
    return this.props.interests || [];
  }
  
  /**
   * Jämför om detta värde-objekt är lika med ett annat
   * @param vo Värde-objekt att jämföra med
   * @returns Sant om värde-objekten är lika
   */
  public equals(vo?: ValueObject<UserProfileProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (!(vo instanceof UserProfile)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
  
  /**
   * Returnerar de primitiva värdena 
   */
  public toValue(): UserProfileProps {
    return {
      ...this.props,
      interests: this.props.interests ? [...this.props.interests] : [],
      socialLinks: this.props.socialLinks ? { ...this.props.socialLinks } : undefined
    };
  }
  
  /**
   * Returnerar användarprofilen som objekt för presentation
   */
  public toDTO(): any {
    return {
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      displayName: this.props.displayName || this.fullName,
      fullName: this.fullName,
      bio: this.props.bio,
      avatarUrl: this.props.avatarUrl,
      location: this.props.location,
      birthDate: this.props.birthDate,
      interests: this.interests,
      socialLinks: this.props.socialLinks ? { ...this.props.socialLinks } : undefined
    };
  }
} 