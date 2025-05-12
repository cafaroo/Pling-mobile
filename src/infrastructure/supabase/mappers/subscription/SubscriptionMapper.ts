import { UniqueId } from '../../../../domain/core/UniqueId';
import { Subscription } from '../../../../domain/subscription/entities/Subscription';
import { SubscriptionPlan } from '../../../../domain/subscription/entities/SubscriptionPlan';
import { PlanFeature, PlanLimits } from '../../../../domain/subscription/value-objects/PlanTypes';
import { BillingAddress, SubscriptionStatus, SubscriptionUsage } from '../../../../domain/subscription/value-objects/SubscriptionTypes';

export interface SubscriptionDTO {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  payment_provider: string;
  payment_customer_id?: string;
  payment_subscription_id?: string;
  payment_method_id?: string;
  billing_email: string;
  billing_name: string;
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  billing_vat_number?: string;
  usage: {
    teamMembers: number;
    mediaStorage: number;
    apiRequests?: number;
    lastUpdated: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: PlanFeature[];
  limits: PlanLimits;
  created_at: string;
  updated_at: string;
}

export class SubscriptionMapper {
  static toDomain(dto: SubscriptionDTO): Subscription {
    return new Subscription({
      id: new UniqueId(dto.id),
      organizationId: new UniqueId(dto.organization_id),
      planId: new UniqueId(dto.plan_id),
      status: dto.status as SubscriptionStatus,
      currentPeriodStart: new Date(dto.current_period_start),
      currentPeriodEnd: new Date(dto.current_period_end),
      cancelAtPeriodEnd: dto.cancel_at_period_end,
      trialEnd: dto.trial_end ? new Date(dto.trial_end) : undefined,
      payment: {
        provider: 'stripe',
        customerId: dto.payment_customer_id || '',
        subscriptionId: dto.payment_subscription_id || '',
        paymentMethodId: dto.payment_method_id,
      },
      billing: {
        email: dto.billing_email,
        name: dto.billing_name,
        address: this.toBillingAddress(dto.billing_address),
        vatNumber: dto.billing_vat_number,
      },
      usage: this.toSubscriptionUsage(dto.usage),
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }

  static toDTO(entity: Subscription): SubscriptionDTO {
    return {
      id: entity.id.toString(),
      organization_id: entity.organizationId.toString(),
      plan_id: entity.planId.toString(),
      status: entity.status,
      current_period_start: entity.currentPeriodStart.toISOString(),
      current_period_end: entity.currentPeriodEnd.toISOString(),
      cancel_at_period_end: entity.cancelAtPeriodEnd,
      trial_end: entity.trialEnd?.toISOString(),
      payment_provider: entity.payment.provider,
      payment_customer_id: entity.payment.customerId,
      payment_subscription_id: entity.payment.subscriptionId,
      payment_method_id: entity.payment.paymentMethodId,
      billing_email: entity.billing.email,
      billing_name: entity.billing.name,
      billing_address: this.fromBillingAddress(entity.billing.address),
      billing_vat_number: entity.billing.vatNumber,
      usage: this.fromSubscriptionUsage(entity.usage),
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  static planToDomain(dto: SubscriptionPlanDTO): SubscriptionPlan {
    return new SubscriptionPlan({
      id: new UniqueId(dto.id),
      name: dto.name as any,
      displayName: dto.display_name,
      description: dto.description,
      price: {
        monthly: dto.price_monthly,
        yearly: dto.price_yearly,
        currency: dto.currency,
      },
      features: dto.features,
      limits: dto.limits,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }

  static planToDTO(entity: SubscriptionPlan): SubscriptionPlanDTO {
    return {
      id: entity.id.toString(),
      name: entity.name,
      display_name: entity.displayName,
      description: entity.description,
      price_monthly: entity.price.monthly,
      price_yearly: entity.price.yearly,
      currency: entity.price.currency,
      features: entity.features,
      limits: entity.limits,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private static toBillingAddress(dto: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  }): BillingAddress {
    return {
      line1: dto.line1,
      line2: dto.line2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postal_code,
      country: dto.country,
    };
  }

  private static fromBillingAddress(address: BillingAddress): {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  } {
    return {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
    };
  }

  private static toSubscriptionUsage(dto: {
    teamMembers: number;
    mediaStorage: number;
    apiRequests?: number;
    lastUpdated: string;
  }): SubscriptionUsage {
    return {
      teamMembers: dto.teamMembers,
      mediaStorage: dto.mediaStorage,
      apiRequests: dto.apiRequests,
      lastUpdated: new Date(dto.lastUpdated),
    };
  }

  private static fromSubscriptionUsage(usage: SubscriptionUsage): {
    teamMembers: number;
    mediaStorage: number;
    apiRequests?: number;
    lastUpdated: string;
  } {
    return {
      teamMembers: usage.teamMembers,
      mediaStorage: usage.mediaStorage,
      apiRequests: usage.apiRequests,
      lastUpdated: usage.lastUpdated.toISOString(),
    };
  }
} 