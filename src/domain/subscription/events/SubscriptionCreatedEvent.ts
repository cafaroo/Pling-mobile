import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Event som genereras när en prenumeration skapas
 */
export class SubscriptionCreatedEvent implements DomainEvent {
  public readonly name = 'subscription.created';
  public readonly occurredAt: Date;

  constructor(
    public readonly subscriptionId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly planId: string,
    public readonly startDate: Date,
    public readonly endDate?: Date,
    public readonly metadata?: Record<string, any>
  ) {
    this.occurredAt = new Date();
  }
} 