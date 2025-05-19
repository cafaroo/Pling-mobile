import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UserProfile } from '../value-objects/UserProfile';

export interface UserProfileUpdatedEventProps {
  userId: string | UniqueId;
  profile: UserProfile | Record<string, any>;
  updatedAt?: Date;
}

/**
 * UserProfileUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares profil har uppdaterats.
 * Innehåller information om den uppdaterade profilen.
 */
export class UserProfileUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly profile: Record<string, any>;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserProfileUpdatedEvent';

  /**
   * Skapar en ny UserProfileUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserProfileUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const updatedAt = props.updatedAt || new Date();
    
    // Konvertera profile till ett JSON-objekt om det behövs
    const profileObj = props.profile instanceof UserProfile
      ? props.profile.toJSON()
      : props.profile;
    
    // Skapa event med payload
    super({
      name: 'UserProfileUpdatedEvent',
      payload: {
        userId: userId.toString(),
        profile: profileObj,
        updatedAt: updatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.profile = profileObj;
    this.updatedAt = updatedAt;
  }
} 