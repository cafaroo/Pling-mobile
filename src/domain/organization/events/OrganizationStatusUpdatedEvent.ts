import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Event som utlöses när en organisation byter status
 */
export interface OrganizationStatusUpdatedEventProps {
  organizationId: string;
  oldStatus: string;
  newStatus: string;
}

/**
 * Representerar händelsen att en organisations status har ändrats
 */
export class OrganizationStatusUpdatedEvent extends DomainEvent {
  static readonly eventName: string = 'organization.status.updated';
  
  public readonly payload: OrganizationStatusUpdatedEventProps;
  
  /**
   * Skapar en ny instans av OrganizationStatusUpdatedEvent
   * 
   * @param props Event-egenskaper med de gamla och nya statusen
   */
  constructor(props: OrganizationStatusUpdatedEventProps) {
    super(OrganizationStatusUpdatedEvent.eventName);
    
    this.payload = {
      organizationId: props.organizationId,
      oldStatus: props.oldStatus,
      newStatus: props.newStatus
    };
  }
  
  /**
   * Hämtar ID för den organisation som ändrade status
   */
  get organizationId(): string {
    return this.payload.organizationId;
  }
  
  /**
   * Hämtar den tidigare statusen
   */
  get oldStatus(): string {
    return this.payload.oldStatus;
  }
  
  /**
   * Hämtar den nya statusen
   */
  get newStatus(): string {
    return this.payload.newStatus;
  }
  
  /**
   * Konverterar event till ett JSON-objekt
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      payload: this.payload
    };
  }
} 