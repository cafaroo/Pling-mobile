import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface UserDeactivatedEventProps {
  userId: string | UniqueId;
  deactivationReason?: string;
  deactivatedAt?: Date;
}

/**
 * UserDeactivatedEvent
 * 
 * Domänhändelse som publiceras när en användare har deaktiverats.
 * Innehåller information om deaktiveringen och anledningen.
 */
export class UserDeactivatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly deactivationReason: string;
  public readonly deactivatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserDeactivatedEvent';

  /**
   * Skapar en ny UserDeactivatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserDeactivatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const deactivatedAt = props.deactivatedAt || new Date();
    const deactivationReason = props.deactivationReason || '';
    
    // Skapa event med payload
    super({
      name: 'UserDeactivatedEvent',
      payload: {
        userId: userId.toString(),
        deactivationReason: deactivationReason,
        deactivatedAt: deactivatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.deactivationReason = deactivationReason;
    this.deactivatedAt = deactivatedAt;
  }
} 