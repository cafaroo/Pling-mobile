import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Event som utlöses när en organisation byter prenumerationsplan
 */
export interface OrganizationPlanUpdatedEventProps {
  organizationId: string;
  oldPlanId: string;
  newPlanId: string;
}

/**
 * Representerar händelsen att en organisations prenumerationsplan har ändrats
 */
export class OrganizationPlanUpdatedEvent extends DomainEvent {
  static readonly eventName: string = 'organization.plan.updated';
  
  public readonly payload: OrganizationPlanUpdatedEventProps;
  
  /**
   * Skapar en ny instans av OrganizationPlanUpdatedEvent
   * 
   * @param props Event-egenskaper med de gamla och nya planernas ID
   */
  constructor(props: OrganizationPlanUpdatedEventProps) {
    super(OrganizationPlanUpdatedEvent.eventName);
    
    this.payload = {
      organizationId: props.organizationId,
      oldPlanId: props.oldPlanId,
      newPlanId: props.newPlanId
    };
  }
  
  /**
   * Hämtar ID för den organisation som ändrade plan
   */
  get organizationId(): string {
    return this.payload.organizationId;
  }
  
  /**
   * Hämtar ID för den tidigare planen
   */
  get oldPlanId(): string {
    return this.payload.oldPlanId;
  }
  
  /**
   * Hämtar ID för den nya planen
   */
  get newPlanId(): string {
    return this.payload.newPlanId;
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