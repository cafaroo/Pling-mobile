import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { ActivityType } from '../value-objects/ActivityType';

export interface TeamActivityProps {
  id: UniqueId;
  teamId: UniqueId;
  type: ActivityType;
  userId: UniqueId;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * TeamActivity representerar en diskret aktivitet som utförts i ett team
 * Den används för att spåra händelser och generera aktivitetsflöden
 */
export class TeamActivity {
  private constructor(private readonly props: TeamActivityProps) {}

  static create(props: TeamActivityProps): Result<TeamActivity, string> {
    if (!Object.values(ActivityType).includes(props.type)) {
      return err('Ogiltig aktivitetstyp');
    }

    return ok(new TeamActivity(props));
  }

  get id(): UniqueId {
    return this.props.id;
  }

  get teamId(): UniqueId {
    return this.props.teamId;
  }

  get type(): ActivityType {
    return this.props.type;
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get timestamp(): Date {
    return new Date(this.props.timestamp);
  }

  get metadata(): Record<string, unknown> {
    return { ...this.props.metadata };
  }

  equals(other: TeamActivity): boolean {
    return this.id.equals(other.id);
  }

  /**
   * Berika en aktivitet med ytterligare metadata
   * Returnerar en ny instans med uppdaterad metadata
   */
  public enrichMetadata(additionalMetadata: Record<string, any>): Result<TeamActivity, string> {
    if (typeof additionalMetadata !== 'object') {
      return err('additionalMetadata måste vara ett objekt');
    }
    
    // Skapa nya props med kombinerad metadata
    const updatedProps: TeamActivityProps = {
      ...this.props,
      metadata: {
        ...this.props.metadata,
        ...additionalMetadata
      }
    };
    
    return ok(new TeamActivity(updatedProps));
  }
  
  /**
   * Kontrollera om aktiviteten är relaterad till en specifik användar-ID
   */
  public isRelatedToUser(userId: UniqueId): boolean {
    // Kontrollera om användaren är den som utförde handlingen
    if (this.userId.equals(userId)) {
      return true;
    }
    
    // Kontrollera metadata för användarreferenser
    if (this.metadata.userId && this.metadata.userId === userId.toString()) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Generera en läsbar beskrivning av aktiviteten baserad på typ och metadata
   */
  public getDescription(): string {
    switch (this.type) {
      case ActivityType.MEMBER_JOINED:
        return `${this.metadata.userName || 'En användare'} gick med i teamet`;
        
      case ActivityType.MEMBER_LEFT:
        return `${this.metadata.userName || 'En användare'} lämnade teamet`;
        
      case ActivityType.MEMBER_ROLE_CHANGED:
        return `${this.metadata.userName || 'En användare'} fick rollen ${this.metadata.newRole || 'uppdaterad'}`;
        
      case ActivityType.TEAM_UPDATED:
        return `Teaminformation uppdaterades av ${this.metadata.updatedBy || 'en användare'}`;
        
      case ActivityType.INVITATION_SENT:
        return `En inbjudan skickades till ${this.metadata.invitedUserEmail || 'en användare'}`;
        
      case ActivityType.INVITATION_ACCEPTED:
        return `${this.metadata.userName || 'En användare'} accepterade en inbjudan`;
        
      case ActivityType.INVITATION_DECLINED:
        return `${this.metadata.userName || 'En användare'} avböjde en inbjudan`;
        
      case ActivityType.TEAM_CREATED:
        return `Teamet skapades av ${this.metadata.createdBy || 'en användare'}`;
        
      case ActivityType.TEAM_SETTINGS_UPDATED:
        return `Teaminställningarna uppdaterades av ${this.metadata.updatedBy || 'en användare'}`;
        
      default:
        return `En aktivitet av typen ${this.type} utfördes`;
    }
  }
} 