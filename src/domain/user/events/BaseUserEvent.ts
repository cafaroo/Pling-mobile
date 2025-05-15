import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';

/**
 * Grundläggande datastruktur för användarrelaterade händelser
 */
export interface UserEventData {
  userId: string;
  email?: string;
  timestamp: Date;
  [key: string]: any;
}

/**
 * BaseUserEvent
 * 
 * Abstrakt basklass för alla användarrelaterade domänevents.
 * Implementerar IDomainEvent och tillhandahåller gemensam funktionalitet
 * för alla användarrelaterade events.
 */
export abstract class BaseUserEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly data: UserEventData;

  /**
   * Skapar en ny bas användarhändelse
   * 
   * @param eventType - Typ av händelse som har inträffat
   * @param user - User-objekt eller ID för aggregatroten
   * @param additionalData - Ytterligare data som ska inkluderas i händelsen
   */
  constructor(
    eventType: string, 
    user: User | UniqueId, 
    additionalData: Record<string, any> = {}
  ) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    
    // Om user är ett User-objekt, extrahera ID och email
    if (user instanceof User) {
      this.aggregateId = user.id.toString();
      this.data = {
        userId: user.id.toString(),
        email: user.email,
        timestamp: this.occurredAt,
        ...additionalData
      };
    } else {
      // Om user är bara ett ID
      this.aggregateId = user.toString();
      this.data = {
        userId: user.toString(),
        timestamp: this.occurredAt,
        ...additionalData
      };
    }
  }
} 