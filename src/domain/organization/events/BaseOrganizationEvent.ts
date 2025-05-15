import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../entities/Organization';

/**
 * Grundläggande datastruktur för organisationsrelaterade händelser
 */
export interface OrganizationEventData {
  organizationId: string;
  timestamp: Date;
  [key: string]: any;
}

/**
 * BaseOrganizationEvent
 * 
 * Abstrakt basklass för alla organisationsrelaterade domänevents.
 * Implementerar IDomainEvent och tillhandahåller gemensam funktionalitet
 * för alla organisationsrelaterade events.
 */
export abstract class BaseOrganizationEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly data: OrganizationEventData;

  /**
   * Skapar en ny bas organisationshändelse
   * 
   * @param eventType - Typ av händelse som har inträffat
   * @param organization - Organization-objekt eller ID för aggregatroten
   * @param additionalData - Ytterligare data som ska inkluderas i händelsen
   */
  constructor(
    eventType: string, 
    organization: Organization | UniqueId, 
    additionalData: Record<string, any> = {}
  ) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    
    // Om organization är ett Organization-objekt, extrahera ID
    if (organization instanceof Organization) {
      this.aggregateId = organization.id.toString();
      this.data = {
        organizationId: organization.id.toString(),
        name: organization.name,
        timestamp: this.occurredAt,
        ...additionalData
      };
    } else {
      // Om organization är bara ett ID
      this.aggregateId = organization.toString();
      this.data = {
        organizationId: organization.toString(),
        timestamp: this.occurredAt,
        ...additionalData
      };
    }
  }
} 