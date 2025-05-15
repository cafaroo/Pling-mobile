import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Event som genereras när en prenumeration uppdateras
 */
export class SubscriptionUpdatedEvent implements DomainEvent {
  public readonly name = 'subscription.updated';
  public readonly occurredAt: Date;

  constructor(
    public readonly subscriptionId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly planId: string,
    public readonly startDate: Date,
    public readonly endDate?: Date,
    public readonly status?: string,
    public readonly metadata?: Record<string, any>,
    public readonly changes?: string[]
  ) {
    this.occurredAt = new Date();
  }
} 