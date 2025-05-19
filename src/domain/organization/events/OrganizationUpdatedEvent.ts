import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { OrgSettings } from '../value-objects/OrgSettings';

export interface OrganizationUpdatedEventProps {
  organizationId: string | UniqueId;
  name: string;
  settings?: OrgSettings;
  updatedAt?: Date;
}

/**
 * OrganizationUpdatedEvent
 * 
 * Domänhändelse som publiceras när en organisation har uppdaterats.
 * Innehåller information om den uppdaterade organisationen.
 */
export class OrganizationUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly name: string;
  public readonly settings?: OrgSettings;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationUpdatedEvent';

  /**
   * Skapar en ny OrganizationUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const updatedAt = props.updatedAt || new Date();
    
    // Skapa payload för eventet
    const payload: Record<string, any> = {
      organizationId: organizationId.toString(),
      name: props.name,
      updatedAt: updatedAt.toISOString()
    };
    
    // Lägg till settings om det finns
    if (props.settings) {
      payload.settings = props.settings;
    }
    
    // Skapa event med payload
    super({
      name: 'OrganizationUpdatedEvent',
      payload
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.name = props.name;
    this.settings = props.settings;
    this.updatedAt = updatedAt;
  }
} 