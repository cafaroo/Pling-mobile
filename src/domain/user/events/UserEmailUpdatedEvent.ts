import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface UserEmailUpdatedEventProps {
  userId: string | UniqueId;
  oldEmail: string;
  newEmail: string;
  updatedAt?: Date;
}

/**
 * UserEmailUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares e-postadress har uppdaterats.
 * Innehåller information om den gamla och nya e-postadressen.
 */
export class UserEmailUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldEmail: string;
  public readonly newEmail: string;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserEmailUpdatedEvent';

  /**
   * Skapar en ny UserEmailUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserEmailUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const updatedAt = props.updatedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'UserEmailUpdatedEvent',
      payload: {
        userId: userId.toString(),
        oldEmail: props.oldEmail,
        newEmail: props.newEmail,
        updatedAt: updatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.oldEmail = props.oldEmail;
    this.newEmail = props.newEmail;
    this.updatedAt = updatedAt;
  }
} 