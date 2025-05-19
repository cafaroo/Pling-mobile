/**
 * Subscription entity
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
import { AggregateRoot, AggregateRootProps } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { BillingAddress, SubscriptionStatus, SubscriptionUsage } from './SubscriptionTypes';
import { 
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent,
  SubscriptionPlanChangedEvent,
  SubscriptionCancelledEvent,
  SubscriptionPeriodUpdatedEvent,
  SubscriptionUsageUpdatedEvent,
  SubscriptionPaymentMethodUpdatedEvent,
  SubscriptionBillingUpdatedEvent,
  BillingInfo
} from '../events';
import { SubscriptionEvents } from '../events/SubscriptionEvents';
import { DomainEvent } from '@/shared/core/DomainEvent';

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
  private events: DomainEvent[] = [];

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
      
      // Använd standardiserad event-klass
      const event = new SubscriptionStatusChangedEvent({
        subscriptionId: this.props.id,
        organizationId: this.props.organizationId,
        oldStatus,
        newStatus,
        changedAt: new Date()
      });
      
      this.events.push(event);
      
      // För bakåtkompatibilitet, lägg även till det gamla event-formatet
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
    
    // Använd standardiserad event-klass
    const event = new SubscriptionUsageUpdatedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      usage: this.props.usage,
      updatedAt: new Date()
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
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
    
    // Använd standardiserad event-klass
    const event = new SubscriptionPeriodUpdatedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      startDate: start,
      endDate: end
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
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
    this.props.status = SubscriptionStatus.CANCELED;
    this.props.updatedAt = new Date();
    
    // Använd standardiserad event-klass
    const event = new SubscriptionCancelledEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      atPeriodEnd,
      cancelledAt: new Date()
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
    this.events.push(new SubscriptionEvents.SubscriptionCancelled({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      atPeriodEnd,
      timestamp: new Date()
    }));
  }

  changePlan(newPlanId: UniqueId): void {
    // Implementation of changePlan method
    const oldPlanId = this.props.planId;
    this.props.planId = newPlanId.toString();
    this.props.updatedAt = new Date();
    
    // Använd standardiserad event-klass
    const event = new SubscriptionPlanChangedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      oldPlanId: oldPlanId,
      newPlanId: newPlanId
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
    this.events.push(new SubscriptionEvents.SubscriptionPlanChanged({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      oldPlanId: UniqueId.from(oldPlanId),
      newPlanId: newPlanId,
      timestamp: new Date()
    }));
  }

  updatePaymentMethod(paymentMethodId: string): void {
    // Implementation of updatePaymentMethod method
    this.props.updatedAt = new Date();
    
    // Använd standardiserad event-klass
    const event = new SubscriptionPaymentMethodUpdatedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      paymentMethodId,
      updatedAt: new Date()
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
    this.events.push(new SubscriptionEvents.SubscriptionPaymentMethodUpdated({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      paymentMethodId,
      timestamp: new Date()
    }));
  }

  updateBillingDetails(billing: Partial<{
    email: string;
    name: string;
    address: Partial<BillingAddress>;
    vatNumber?: string;
  }>): void {
    // Implementation of updateBillingDetails method
    this.props.updatedAt = new Date();
    
    // Sammanställ komplett faktureringsinfo
    const billingInfo: BillingInfo = {
      email: billing.email || this.billing.email,
      name: billing.name || this.billing.name,
      address: {
        street: billing.address?.street || this.billing.address.street,
        city: billing.address?.city || this.billing.address.city,
        state: billing.address?.state || this.billing.address.state,
        postalCode: billing.address?.postalCode || this.billing.address.postalCode,
        country: billing.address?.country || this.billing.address.country,
      },
      vatNumber: billing.vatNumber || this.billing.vatNumber,
    };
    
    // Använd standardiserad event-klass
    const event = new SubscriptionBillingUpdatedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      billing: billingInfo,
      updatedAt: new Date()
    });
    
    this.events.push(event);
    
    // För bakåtkompatibilitet, lägg även till det gamla event-formatet
    this.events.push(new SubscriptionEvents.SubscriptionBillingUpdated({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      billing: billingInfo,
      timestamp: new Date()
    }));
  }

  flushEvents(): DomainEvent[] {
    const pendingEvents = [...this.events];
    this.events = [];
    return pendingEvents;
  }

  /**
   * Skapar en ny prenumerationsentitet
   * 
   * @param dto - Data för att skapa prenumerationen
   * @returns Result med den skapade prenumerationen eller felmeddelande
   */
  public static create(dto: SubscriptionCreateDTO): Result<Subscription, string> {
    try {
      // Konvertera organizationId till UniqueId om det inte redan är det
      const organizationId = typeof dto.organizationId === 'string' 
        ? new UniqueId(dto.organizationId) 
        : dto.organizationId;
      
      // Sätt standardvärden för valfria parametrar
      const status = dto.status || SubscriptionStatus.ACTIVE;
      const startDate = dto.startDate || new Date();
      const endDate = dto.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dagar som standard
      
      // Skapa prenumerationen
      const subscription = new Subscription({
        id: new UniqueId(),
        organizationId,
        planId: dto.planId,
        status,
        startDate,
        endDate,
        metadata: dto.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Skapa standardiserat event
      const event = new SubscriptionCreatedEvent({
        subscriptionId: subscription.id,
        organizationId: subscription.organizationId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        createdAt: subscription.createdAt
      });
      
      // Lägg till både standardiserat och gammalt event-format för bakåtkompatibilitet
      subscription.events.push(event);
      subscription.events.push(new SubscriptionEvents.SubscriptionCreated({
        subscriptionId: subscription.id,
        organizationId: subscription.organizationId,
        planId: UniqueId.from(subscription.planId),
        status: subscription.status,
        timestamp: subscription.createdAt
      }));
      
      return ok(subscription);
    } catch (error) {
      return err((error as Error).message);
    }
  }

  // Interna implementationer (byt namn)
  private _changePlan(newPlanId: UniqueId): void {
    const oldPlanId = this.props.planId;
    this.props.planId = newPlanId.toString();
    this.props.updatedAt = new Date();
    const event = new SubscriptionPlanChangedEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      oldPlanId: oldPlanId,
      newPlanId: newPlanId
    });
    this.events.push(event);
    this.events.push(new SubscriptionEvents.SubscriptionPlanChanged({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      oldPlanId: UniqueId.from(oldPlanId),
      newPlanId: newPlanId,
      timestamp: new Date()
    }));
  }

  private _cancel(atPeriodEnd: boolean = true): void {
    this.props.status = SubscriptionStatus.CANCELED;
    this.props.updatedAt = new Date();
    const event = new SubscriptionCancelledEvent({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      atPeriodEnd,
      cancelledAt: new Date()
    });
    this.events.push(event);
    this.events.push(new SubscriptionEvents.SubscriptionCancelled({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      atPeriodEnd,
      timestamp: new Date()
    }));
  }

  /**
   * Publik wrapper för att ändra status (för tester och mocks)
   */
  public changeStatus(newStatus: SubscriptionStatus): void {
    this.updateStatus(newStatus);
  }

  /**
   * Publik wrapper för att ändra plan (för tester och mocks)
   */
  public changePlan(newPlanId: string): void {
    const planIdObj = typeof newPlanId === 'string' ? new UniqueId(newPlanId) : newPlanId;
    this._changePlan(planIdObj);
  }

  /**
   * Publik wrapper för att avbryta prenumeration (för tester och mocks)
   */
  public cancel(reason: string): void {
    if (!this.props.metadata) this.props.metadata = {};
    this.props.metadata.cancelReason = reason;
    this._cancel(true);
  }
} 