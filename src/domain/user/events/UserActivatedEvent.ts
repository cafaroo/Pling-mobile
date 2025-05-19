import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface UserActivatedEventProps {
  userId: string | UniqueId;
  activationReason?: string;
  activatedAt?: Date;
}

/**
 * UserActivatedEvent
 * 
 * Domänhändelse som publiceras när en användare har aktiverats.
 * Innehåller information om aktiveringen och aktiveringsanledningen.
 */
export class UserActivatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly activationReason: string;
  public readonly activatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserActivatedEvent';

  /**
   * Skapar en ny UserActivatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserActivatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const activatedAt = props.activatedAt || new Date();
    const activationReason = props.activationReason || '';
    
    // Skapa event med payload
    super({
      name: 'UserActivatedEvent',
      payload: {
        userId: userId.toString(),
        activationReason: activationReason,
        activatedAt: activatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.activationReason = activationReason;
    this.activatedAt = activatedAt;
  }
} 