import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '../entities/Team';

/**
 * Grundläggande datastruktur för teamrelaterade händelser
 */
export interface TeamEventData {
  teamId: string;
  teamName?: string;
  timestamp: Date;
  [key: string]: any;
}

/**
 * BaseTeamEvent
 * 
 * Abstrakt basklass för alla teamrelaterade domänevents.
 * Implementerar IDomainEvent och tillhandahåller gemensam funktionalitet
 * för alla teamrelaterade events.
 */
export abstract class BaseTeamEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly data: TeamEventData;

  /**
   * Skapar en ny bas teamhändelse
   * 
   * @param eventType - Typ av händelse som har inträffat
   * @param team - Team-objekt eller ID för aggregatroten
   * @param additionalData - Ytterligare data som ska inkluderas i händelsen
   */
  constructor(
    eventType: string, 
    team: Team | UniqueId, 
    additionalData: Record<string, any> = {}
  ) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    
    // Om team är ett Team-objekt, extrahera ID och namn
    if (team instanceof Team) {
      this.aggregateId = team.id.toString();
      this.data = {
        teamId: team.id.toString(),
        teamName: team.name,
        timestamp: this.occurredAt,
        ...additionalData
      };
    } else {
      // Om team är bara ett ID
      this.aggregateId = team.toString();
      this.data = {
        teamId: team.toString(),
        timestamp: this.occurredAt,
        ...additionalData
      };
    }
  }
} 