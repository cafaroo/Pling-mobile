import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionFeature,
  SubscriptionLimits
} from '@/domain/subscription/entities/SubscriptionTypes';

/**
 * DTOs för subscription-relaterade operationer i applikationslagret
 */

// CreateSubscriptionDTO används i CreateSubscriptionUseCase
export interface CreateSubscriptionDTO {
  organizationId: string;
  planId: string;
  paymentMethodId?: string;
  startImmediately?: boolean;
}

// UpdateSubscriptionDTO används i UpdateSubscriptionUseCase
export interface UpdateSubscriptionDTO {
  subscriptionId: string;
  planId?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
}

// FeatureDTO används för presentation av prenumerationsfunktioner
export interface FeatureDTO {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  meta?: Record<string, any>;
}

// LimitsDTO används för presentation av prenumerationsbegränsningar
export interface LimitsDTO {
  teamMembers: number;
  teams: number;
  storageGB: number;
  [key: string]: number;
}

// PlanDTO används för presentation av prenumerationsplaner
export interface PlanDTO {
  id: string;
  displayName: string;
  description: string;
  features: FeatureDTO[];
  limits: LimitsDTO;
  price: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
  isRecommended?: boolean;
  metadata?: Record<string, any>;
}

// SubscriptionDTO används för presentation av prenumerationer
export interface SubscriptionDTO {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  plan?: PlanDTO;
}

/**
 * SubscriptionDTOMapper
 * 
 * Ansvarar för konvertering mellan domänmodell och DTOs i applikationslagret.
 */
export class SubscriptionDTOMapper {
  /**
   * Konverterar CreateSubscriptionDTO till domän-parametrar
   */
  static toCreateParamsFromDTO(dto: CreateSubscriptionDTO): Result<{
    organizationId: UniqueId;
    planId: string;
    paymentMethodId?: string;
    startImmediately: boolean;
  }> {
    try {
      if (!dto.organizationId || !dto.planId) {
        return err('organizationId and planId are required');
      }

      return ok({
        organizationId: new UniqueId(dto.organizationId),
        planId: dto.planId,
        paymentMethodId: dto.paymentMethodId,
        startImmediately: dto.startImmediately ?? true
      });
    } catch (error) {
      return err(`Error in SubscriptionDTOMapper.toCreateParamsFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar UpdateSubscriptionDTO till domän-parametrar
   */
  static toUpdateParamsFromDTO(dto: UpdateSubscriptionDTO): Result<{
    subscriptionId: UniqueId;
    planId?: string;
    status?: SubscriptionStatus;
    cancelAtPeriodEnd?: boolean;
  }> {
    try {
      if (!dto.subscriptionId) {
        return err('subscriptionId is required');
      }

      return ok({
        subscriptionId: new UniqueId(dto.subscriptionId),
        planId: dto.planId,
        status: dto.status as SubscriptionStatus,
        cancelAtPeriodEnd: dto.cancelAtPeriodEnd
      });
    } catch (error) {
      return err(`Error in SubscriptionDTOMapper.toUpdateParamsFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar SubscriptionFeature till FeatureDTO
   */
  static featureToDTO(feature: SubscriptionFeature): FeatureDTO {
    return {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      enabled: feature.enabled,
      meta: feature.meta
    };
  }

  /**
   * Konverterar SubscriptionLimits till LimitsDTO
   */
  static limitsToDTO(limits: SubscriptionLimits): LimitsDTO {
    return {
      teamMembers: limits.teamMembers,
      teams: limits.teams,
      storageGB: limits.storageGB,
      ...limits.custom
    };
  }

  /**
   * Konverterar SubscriptionPlan till PlanDTO
   */
  static planToDTO(plan: SubscriptionPlan): PlanDTO {
    return {
      id: plan.id,
      displayName: plan.displayName,
      description: plan.description || '',
      features: plan.features.map(feature => this.featureToDTO(feature)),
      limits: this.limitsToDTO(plan.limits),
      price: {
        amount: plan.price.amount,
        currency: plan.price.currency,
        interval: plan.price.interval
      },
      isRecommended: plan.isRecommended,
      metadata: plan.metadata
    };
  }

  /**
   * Konverterar Subscription-domänmodell till DTO
   */
  static toDTO(subscription: Subscription, includePlan: boolean = false): SubscriptionDTO {
    const dto: SubscriptionDTO = {
      id: subscription.id.toString(),
      organizationId: subscription.organizationId.toString(),
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt?.toISOString(),
      trialEnd: subscription.trialEnd?.toISOString()
    };

    if (includePlan && subscription.plan) {
      dto.plan = this.planToDTO(subscription.plan);
    }

    return dto;
  }

  /**
   * Konverterar flera Subscription-domänmodeller till DTOs
   */
  static toDTOList(subscriptions: Subscription[], includePlans: boolean = false): SubscriptionDTO[] {
    return subscriptions.map(subscription => this.toDTO(subscription, includePlans));
  }

  /**
   * Konverterar FeatureDTO till domän-modell
   */
  static toFeatureFromDTO(dto: FeatureDTO): SubscriptionFeature {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      enabled: dto.enabled,
      meta: dto.meta
    };
  }

  /**
   * Konverterar LimitsDTO till domän-modell
   */
  static toLimitsFromDTO(dto: LimitsDTO): SubscriptionLimits {
    const { teamMembers, teams, storageGB, ...custom } = dto;
    
    return {
      teamMembers,
      teams,
      storageGB,
      custom
    };
  }

  /**
   * Konverterar PlanDTO till domän-modell
   */
  static toPlanFromDTO(dto: PlanDTO): SubscriptionPlan {
    return {
      id: dto.id,
      displayName: dto.displayName,
      description: dto.description,
      features: dto.features.map(feature => this.toFeatureFromDTO(feature)),
      limits: this.toLimitsFromDTO(dto.limits),
      price: {
        amount: dto.price.amount,
        currency: dto.price.currency,
        interval: dto.price.interval
      },
      isRecommended: dto.isRecommended,
      metadata: dto.metadata
    };
  }

  /**
   * Konverterar SubscriptionDTO till domän-modell
   */
  static toSubscriptionFromDTO(dto: SubscriptionDTO): Result<Subscription> {
    try {
      if (!dto.id || !dto.organizationId || !dto.planId || !dto.status) {
        return err('Incomplete subscription data');
      }

      const subscription: Subscription = {
        id: new UniqueId(dto.id),
        organizationId: new UniqueId(dto.organizationId),
        planId: dto.planId,
        status: dto.status as SubscriptionStatus,
        currentPeriodStart: new Date(dto.currentPeriodStart),
        currentPeriodEnd: new Date(dto.currentPeriodEnd),
        cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
        canceledAt: dto.canceledAt ? new Date(dto.canceledAt) : undefined,
        trialEnd: dto.trialEnd ? new Date(dto.trialEnd) : undefined
      };

      if (dto.plan) {
        subscription.plan = this.toPlanFromDTO(dto.plan);
      }

      return ok(subscription);
    } catch (error) {
      return err(`Error in SubscriptionDTOMapper.toSubscriptionFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 