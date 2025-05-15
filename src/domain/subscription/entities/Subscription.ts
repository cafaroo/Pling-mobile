/**
 * Subscription entity
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
import { AggregateRoot, AggregateRootProps } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { BillingAddress, SubscriptionStatus, SubscriptionUsage } from '../value-objects/SubscriptionTypes';
import { SubscriptionEvents } from '../events/SubscriptionEvents';

export interface SubscriptionProps extends AggregateRootProps {
  organizationId: UniqueId;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionCreateDTO {
  organizationId: UniqueId | string;
  planId: string;
  status?: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

/**
 * Subscription - prenumerationsmodell
 */
export class Subscription extends AggregateRoot<SubscriptionProps> {
  private events: SubscriptionEvents[] = [];

  constructor(props: SubscriptionProps) {
    super(props);
    this.validateProps(props);
  }

  private validateProps(props: SubscriptionProps): void {
    if (!props.organizationId) {
      throw new Error('Subscription måste ha en organisationsID');
    }

    if (!props.planId) {
      throw new Error('Subscription måste ha en planID');
    }

    if (!props.startDate || !props.endDate) {
      throw new Error('Subscription måste ha giltiga periodtider');
    }

    if (props.startDate >= props.endDate) {
      throw new Error('Slutdatum måste vara senare än startdatum');
    }
  }

  get organizationId(): UniqueId {
    return this.props.organizationId;
  }

  get planId(): string {
    return this.props.planId;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get isActive(): boolean {
    return ['active', 'trialing'].includes(this.props.status);
  }

  get isPastDue(): boolean {
    return this.props.status === 'past_due';
  }

  get isCanceled(): boolean {
    return this.props.status === 'canceled';
  }

  get currentPeriodStart(): Date {
    return this.props.startDate;
  }

  get currentPeriodEnd(): Date {
    return this.props.endDate;
  }

  get cancelAtPeriodEnd(): boolean {
    return false;
  }

  get trialEnd(): Date | undefined {
    return undefined;
  }

  get payment(): {
    provider: 'stripe';
    customerId: string;
    subscriptionId: string;
    paymentMethodId?: string;
  } {
    return {
      provider: 'stripe',
      customerId: '',
      subscriptionId: '',
    };
  }

  get billing(): {
    email: string;
    name: string;
    address: BillingAddress;
    vatNumber?: string;
  } {
    return {
      email: '',
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    };
  }

  get usage(): SubscriptionUsage {
    return {
      teamMembers: 0,
      mediaStorage: 0,
      lastUpdated: new Date(),
    };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get daysUntilRenewal(): number {
    const now = new Date();
    const end = this.props.endDate;
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isInTrial(): boolean {
    return false;
  }

  getDaysLeftInTrial(): number {
    return 0;
  }

  updateStatus(newStatus: SubscriptionStatus): void {
    if (this.props.status !== newStatus) {
      const oldStatus = this.props.status;
      this.props.status = newStatus;
      this.props.updatedAt = new Date();
      
      this.events.push(new SubscriptionEvents.SubscriptionStatusChanged({
        subscriptionId: this.props.id,
        organizationId: this.props.organizationId,
        oldStatus,
        newStatus,
        timestamp: new Date()
      }));
    }
  }

  updateUsage(usage: Partial<SubscriptionUsage>): void {
    this.props.usage = {
      ...this.props.usage,
      ...usage,
      lastUpdated: new Date()
    };
    this.props.updatedAt = new Date();
    
    this.events.push(new SubscriptionEvents.SubscriptionUsageUpdated({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      usage: this.props.usage,
      timestamp: new Date()
    }));
  }

  updatePeriod(start: Date, end: Date): void {
    if (start >= end) {
      throw new Error('Slutdatum måste vara senare än startdatum');
    }
    
    this.props.startDate = start;
    this.props.endDate = end;
    this.props.updatedAt = new Date();
    
    this.events.push(new SubscriptionEvents.SubscriptionPeriodUpdated({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      startDate: start,
      endDate: end,
      timestamp: new Date()
    }));
  }

  cancel(atPeriodEnd: boolean = true): void {
    // Implementation of cancel method
  }

  changePlan(newPlanId: UniqueId): void {
    // Implementation of changePlan method
  }

  updatePaymentMethod(paymentMethodId: string): void {
    // Implementation of updatePaymentMethod method
  }

  updateBillingDetails(billing: Partial<{
    email: string;
    name: string;
    address: Partial<BillingAddress>;
    vatNumber?: string;
  }>): void {
    // Implementation of updateBillingDetails method
  }

  flushEvents(): SubscriptionEvents[] {
    const pendingEvents = [...this.events];
    this.events = [];
    return pendingEvents;
  }

  /**
   * Skapar en ny prenumeration
   */
  public static create(dto: SubscriptionCreateDTO): Result<Subscription, string> {
    try {
      // Validera input
      if (!dto.planId) {
        return err('Prenumerationsplan måste anges');
      }

      if (!dto.organizationId) {
        return err('Organisation måste anges');
      }

      const id = new UniqueId();
      const organizationId = dto.organizationId instanceof UniqueId 
        ? dto.organizationId 
        : new UniqueId(dto.organizationId);
      
      const subscription = new Subscription({
        id,
        organizationId,
        planId: dto.planId,
        status: dto.status || SubscriptionStatus.PENDING,
        startDate: dto.startDate || new Date(),
        endDate: dto.endDate,
        metadata: dto.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return ok(subscription);
    } catch (error) {
      return err(`Kunde inte skapa prenumeration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 