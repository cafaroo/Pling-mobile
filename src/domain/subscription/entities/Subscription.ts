import { UniqueId } from '../../core/UniqueId';
import { BillingAddress, SubscriptionStatus, SubscriptionUsage } from '../value-objects/SubscriptionTypes';
import { SubscriptionEvents } from '../events/SubscriptionEvents';

export interface SubscriptionProps {
  id: UniqueId;
  organizationId: UniqueId;
  planId: UniqueId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  payment: {
    provider: 'stripe';
    customerId: string;
    subscriptionId: string;
    paymentMethodId?: string;
  };
  billing: {
    email: string;
    name: string;
    address: BillingAddress;
    vatNumber?: string;
  };
  usage: SubscriptionUsage;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private props: SubscriptionProps;
  private events: SubscriptionEvents[] = [];

  constructor(props: SubscriptionProps) {
    this.validateProps(props);
    this.props = props;
  }

  private validateProps(props: SubscriptionProps): void {
    if (!props.organizationId) {
      throw new Error('Subscription måste ha en organisationsID');
    }

    if (!props.planId) {
      throw new Error('Subscription måste ha en planID');
    }

    if (!props.currentPeriodStart || !props.currentPeriodEnd) {
      throw new Error('Subscription måste ha giltiga periodtider');
    }

    if (props.currentPeriodStart >= props.currentPeriodEnd) {
      throw new Error('Slutdatum måste vara senare än startdatum');
    }
  }

  get id(): UniqueId {
    return this.props.id;
  }

  get organizationId(): UniqueId {
    return this.props.organizationId;
  }

  get planId(): UniqueId {
    return this.props.planId;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
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
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    return this.props.currentPeriodEnd;
  }

  get cancelAtPeriodEnd(): boolean {
    return this.props.cancelAtPeriodEnd;
  }

  get trialEnd(): Date | undefined {
    return this.props.trialEnd;
  }

  get payment(): {
    provider: 'stripe';
    customerId: string;
    subscriptionId: string;
    paymentMethodId?: string;
  } {
    return this.props.payment;
  }

  get billing(): {
    email: string;
    name: string;
    address: BillingAddress;
    vatNumber?: string;
  } {
    return this.props.billing;
  }

  get usage(): SubscriptionUsage {
    return this.props.usage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get daysUntilRenewal(): number {
    const now = new Date();
    const end = this.props.currentPeriodEnd;
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isInTrial(): boolean {
    if (!this.props.trialEnd) return false;
    
    const now = new Date();
    return this.props.status === 'trialing' && this.props.trialEnd > now;
  }

  getDaysLeftInTrial(): number {
    if (!this.props.trialEnd) return 0;
    
    const now = new Date();
    if (this.props.trialEnd <= now) return 0;
    
    const diffTime = this.props.trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    
    this.props.currentPeriodStart = start;
    this.props.currentPeriodEnd = end;
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
    this.props.cancelAtPeriodEnd = atPeriodEnd;
    
    if (!atPeriodEnd) {
      this.props.status = 'canceled';
    }
    
    this.props.updatedAt = new Date();
    
    this.events.push(new SubscriptionEvents.SubscriptionCancelled({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      atPeriodEnd,
      timestamp: new Date()
    }));
  }

  changePlan(newPlanId: UniqueId): void {
    const oldPlanId = this.props.planId;
    this.props.planId = newPlanId;
    this.props.updatedAt = new Date();
    
    this.events.push(new SubscriptionEvents.SubscriptionPlanChanged({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      oldPlanId,
      newPlanId,
      timestamp: new Date()
    }));
  }

  updatePaymentMethod(paymentMethodId: string): void {
    this.props.payment.paymentMethodId = paymentMethodId;
    this.props.updatedAt = new Date();
    
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
    if (billing.email) {
      this.props.billing.email = billing.email;
    }
    
    if (billing.name) {
      this.props.billing.name = billing.name;
    }
    
    if (billing.address) {
      this.props.billing.address = {
        ...this.props.billing.address,
        ...billing.address
      };
    }
    
    if (billing.vatNumber !== undefined) {
      this.props.billing.vatNumber = billing.vatNumber;
    }
    
    this.props.updatedAt = new Date();
    
    this.events.push(new SubscriptionEvents.SubscriptionBillingUpdated({
      subscriptionId: this.props.id,
      organizationId: this.props.organizationId,
      billing: this.props.billing,
      timestamp: new Date()
    }));
  }

  flushEvents(): SubscriptionEvents[] {
    const pendingEvents = [...this.events];
    this.events = [];
    return pendingEvents;
  }

  static createTrialSubscription(
    id: UniqueId,
    organizationId: UniqueId,
    planId: UniqueId,
    stripeCustomerId: string,
    email: string,
    name: string,
    address: BillingAddress
  ): Subscription {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 14); // 14 dagars prövoperiod
    
    const periodEnd = new Date();
    periodEnd.setDate(now.getDate() + 30); // 30 dagars period
    
    const subscription = new Subscription({
      id,
      organizationId,
      planId,
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEnd,
      payment: {
        provider: 'stripe',
        customerId: stripeCustomerId,
        subscriptionId: '', // Tilldelas senare av Stripe
      },
      billing: {
        email,
        name,
        address,
      },
      usage: {
        teamMembers: 0,
        mediaStorage: 0,
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
    });
    
    subscription.events.push(new SubscriptionEvents.SubscriptionCreated({
      subscriptionId: id,
      organizationId,
      planId,
      status: 'trialing',
      timestamp: now
    }));
    
    return subscription;
  }
} 