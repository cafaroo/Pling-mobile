import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface UserCreatedEventProps {
  userId: string | UniqueId;
  email: string;
  name: string;
  createdAt?: Date;
}

/**
 * UserCreatedEvent
 * 
 * Domänhändelse som publiceras när en ny användare har skapats.
 * Innehåller grundläggande information om den nya användaren.
 */
export class UserCreatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly email: string;
  public readonly name: string;
  public readonly createdAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserCreatedEvent';

  /**
   * Skapar en ny UserCreatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserCreatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const createdAt = props.createdAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'UserCreatedEvent',
      payload: {
        userId: userId.toString(),
        email: props.email,
        name: props.name,
        createdAt: createdAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.email = props.email;
    this.name = props.name;
    this.createdAt = createdAt;
  }
} 