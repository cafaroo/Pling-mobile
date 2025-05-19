import { UniqueId } from '../../core/UniqueId';
import { BillingAddress, SubscriptionStatus, SubscriptionUsage } from '../entities/SubscriptionTypes';

export namespace SubscriptionEvents {
  export interface BaseEvent {
    subscriptionId: UniqueId;
    organizationId: UniqueId;
    timestamp: Date;
  }

  export class SubscriptionCreated implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly planId: UniqueId;
    readonly status: SubscriptionStatus;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      planId: UniqueId;
      status: SubscriptionStatus;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.planId = props.planId;
      this.status = props.status;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.created';
    }
  }

  export class SubscriptionStatusChanged implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly oldStatus: SubscriptionStatus;
    readonly newStatus: SubscriptionStatus;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      oldStatus: SubscriptionStatus;
      newStatus: SubscriptionStatus;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.oldStatus = props.oldStatus;
      this.newStatus = props.newStatus;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.status_changed';
    }
  }

  export class SubscriptionPlanChanged implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly oldPlanId: UniqueId;
    readonly newPlanId: UniqueId;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      oldPlanId: UniqueId;
      newPlanId: UniqueId;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.oldPlanId = props.oldPlanId;
      this.newPlanId = props.newPlanId;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.plan_changed';
    }
  }

  export class SubscriptionCancelled implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly atPeriodEnd: boolean;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      atPeriodEnd: boolean;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.atPeriodEnd = props.atPeriodEnd;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.cancelled';
    }
  }

  export class SubscriptionPeriodUpdated implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      startDate: Date;
      endDate: Date;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.startDate = props.startDate;
      this.endDate = props.endDate;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.period_updated';
    }
  }

  export class SubscriptionUsageUpdated implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly usage: SubscriptionUsage;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      usage: SubscriptionUsage;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.usage = props.usage;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.usage_updated';
    }
  }

  export class SubscriptionPaymentMethodUpdated implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly paymentMethodId: string;
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      paymentMethodId: string;
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.paymentMethodId = props.paymentMethodId;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.payment_method_updated';
    }
  }

  export class SubscriptionBillingUpdated implements BaseEvent {
    readonly subscriptionId: UniqueId;
    readonly organizationId: UniqueId;
    readonly billing: {
      email: string;
      name: string;
      address: BillingAddress;
      vatNumber?: string;
    };
    readonly timestamp: Date;

    constructor(props: {
      subscriptionId: UniqueId;
      organizationId: UniqueId;
      billing: {
        email: string;
        name: string;
        address: BillingAddress;
        vatNumber?: string;
      };
      timestamp: Date;
    }) {
      this.subscriptionId = props.subscriptionId;
      this.organizationId = props.organizationId;
      this.billing = props.billing;
      this.timestamp = props.timestamp;
    }

    get name(): string {
      return 'subscription.billing_updated';
    }
  }

  export type Event =
    | SubscriptionCreated
    | SubscriptionStatusChanged
    | SubscriptionPlanChanged
    | SubscriptionCancelled
    | SubscriptionPeriodUpdated
    | SubscriptionUsageUpdated
    | SubscriptionPaymentMethodUpdated
    | SubscriptionBillingUpdated;
} 