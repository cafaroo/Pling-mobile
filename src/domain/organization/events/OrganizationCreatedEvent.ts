import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Händelse som publiceras när en organisation skapas
 */
export class OrganizationCreatedEvent extends DomainEvent {
  public readonly name: string;
  public readonly ownerId: UniqueId;
  public readonly organizationId: UniqueId;

  constructor(organizationId: UniqueId, name: string, ownerId: UniqueId) {
    super({
      name: 'OrganizationCreatedEvent',
      payload: {
        organizationId: organizationId.toString(),
        name,
        ownerId: ownerId.toString()
      }
    });
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.name = name;
    this.ownerId = ownerId;
    this.organizationId = organizationId;
  }
} 