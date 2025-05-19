import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface UserStatusChangedEventProps {
  userId: string | UniqueId;
  oldStatus: string;
  newStatus: string;
  changedAt?: Date;
}

/**
 * UserStatusChangedEvent
 * 
 * Domänhändelse som publiceras när en användares status har ändrats.
 * Innehåller information om statusändringen.
 */
export class UserStatusChangedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldStatus: string;
  public readonly newStatus: string;
  public readonly changedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserStatusChangedEvent';

  /**
   * Skapar en ny UserStatusChangedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserStatusChangedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const changedAt = props.changedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'UserStatusChangedEvent',
      payload: {
        userId: userId.toString(),
        oldStatus: props.oldStatus,
        newStatus: props.newStatus,
        changedAt: changedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.oldStatus = props.oldStatus;
    this.newStatus = props.newStatus;
    this.changedAt = changedAt;
  }
} 