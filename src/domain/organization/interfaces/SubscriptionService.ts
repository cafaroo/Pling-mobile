import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';

/**
 * Definierar en prenumerationsplan med egenskaper och begränsningar
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    maxResources: number;
    maxTeams: number;
    maxMembersPerTeam: number;
    maxStorageGB: number;
    allowAdvancedPermissions: boolean;
    allowIntegrations: boolean;
    allowExport: boolean;
    prioritySupport: boolean;
  };
}

/**
 * Representerar statusen för en organisations prenumeration
 */
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  plan: SubscriptionPlan | null;
  currentUsage: {
    resourceCount: number;
    teamCount: number;
    storageUsedBytes: number;
  };
  expiresAt: Date | null;
  trialEndsAt: Date | null;
  isInTrial: boolean;
  isCancelled: boolean;
  willRenew: boolean;
}

/**
 * Resultat för en validering av resursbegränsning
 */
export interface ResourceLimitValidation {
  isAllowed: boolean;
  currentUsage: number;
  limit: number;
  message: string;
}

/**
 * Typer av resursbegränsningar som kan valideras
 */
export enum ResourceLimitType {
  RESOURCE_COUNT = 'resourceCount',
  TEAM_COUNT = 'teamCount',
  MEMBERS_PER_TEAM = 'membersPerTeam',
  STORAGE = 'storage',
  ADVANCED_PERMISSIONS = 'advancedPermissions',
  INTEGRATIONS = 'integrations',
  EXPORT = 'export'
}

/**
 * Servicegränssnitt som exponerar prenumerationsfunktionalitet till organization-domänen
 * Detta gränssnitt ska implementeras av subscription-domänen
 */
export interface SubscriptionService {
  /**
   * Kontrollerar om en organisation har en aktiv prenumeration
   */
  hasActiveSubscription(organizationId: UniqueId | string): Promise<boolean>;

  /**
   * Hämtar detaljerad prenumerationsstatus för en organisation
   */
  getSubscriptionStatus(organizationId: UniqueId | string): Promise<Result<SubscriptionStatus>>;

  /**
   * Validerar om en viss åtgärd är tillåten baserat på prenumerationsbegränsningar
   */
  validateResourceLimit(
    organizationId: UniqueId | string,
    limitType: ResourceLimitType,
    additionalUsage?: number
  ): Promise<Result<ResourceLimitValidation>>;

  /**
   * Genererar en URL för att uppdatera en organisations prenumeration
   */
  getSubscriptionManagementUrl(organizationId: UniqueId | string): Promise<Result<string>>;

  /**
   * Hämtar alla tillgängliga prenumerationsplaner
   */
  getAvailablePlans(): Promise<Result<SubscriptionPlan[]>>;
}

/**
 * Tom implementering av SubscriptionService som kan användas under utveckling
 * eller i tester där faktisk prenumerationskontroll inte behövs
 */
export class NoOpSubscriptionService implements SubscriptionService {
  async hasActiveSubscription(): Promise<boolean> {
    return true; // Alltid aktiv i denna utvecklingsimplementation
  }

  async getSubscriptionStatus(organizationId: UniqueId | string): Promise<Result<SubscriptionStatus>> {
    const defaultPlan: SubscriptionPlan = {
      id: 'free-plan',
      name: 'free',
      displayName: 'Gratisplan',
      description: 'Grundläggande funktionalitet utan kostnad',
      isActive: true,
      price: 0,
      currency: 'SEK',
      interval: 'monthly',
      features: {
        maxResources: 100,
        maxTeams: 5,
        maxMembersPerTeam: 10,
        maxStorageGB: 1,
        allowAdvancedPermissions: false,
        allowIntegrations: false,
        allowExport: false,
        prioritySupport: false
      }
    };

    const status: SubscriptionStatus = {
      hasActiveSubscription: true,
      plan: defaultPlan,
      currentUsage: {
        resourceCount: 0,
        teamCount: 0,
        storageUsedBytes: 0
      },
      expiresAt: null,
      trialEndsAt: null,
      isInTrial: false,
      isCancelled: false,
      willRenew: true
    };

    return Result.ok(status);
  }

  async validateResourceLimit(
    organizationId: UniqueId | string,
    limitType: ResourceLimitType,
    additionalUsage: number = 0
  ): Promise<Result<ResourceLimitValidation>> {
    // I denna utvecklingsimplementation tillåts allt
    const response: ResourceLimitValidation = {
      isAllowed: true,
      currentUsage: 0,
      limit: 999999,
      message: 'Tillåtet i utvecklingsläge'
    };

    return Result.ok(response);
  }

  async getSubscriptionManagementUrl(organizationId: UniqueId | string): Promise<Result<string>> {
    return Result.ok('#subscription-management-placeholder');
  }

  async getAvailablePlans(): Promise<Result<SubscriptionPlan[]>> {
    const freePlan: SubscriptionPlan = {
      id: 'free-plan',
      name: 'free',
      displayName: 'Gratisplan',
      description: 'Grundläggande funktionalitet utan kostnad',
      isActive: true,
      price: 0,
      currency: 'SEK',
      interval: 'monthly',
      features: {
        maxResources: 100,
        maxTeams: 5,
        maxMembersPerTeam: 10,
        maxStorageGB: 1,
        allowAdvancedPermissions: false,
        allowIntegrations: false,
        allowExport: false,
        prioritySupport: false
      }
    };

    const proPlan: SubscriptionPlan = {
      id: 'pro-plan',
      name: 'pro',
      displayName: 'Professionell',
      description: 'Avancerade funktioner för team',
      isActive: true,
      price: 249,
      currency: 'SEK',
      interval: 'monthly',
      features: {
        maxResources: 1000,
        maxTeams: 20,
        maxMembersPerTeam: 25,
        maxStorageGB: 10,
        allowAdvancedPermissions: true,
        allowIntegrations: true,
        allowExport: true,
        prioritySupport: false
      }
    };

    const businessPlan: SubscriptionPlan = {
      id: 'business-plan',
      name: 'business',
      displayName: 'Företag',
      description: 'Fullständiga funktioner för organisationer',
      isActive: true,
      price: 499,
      currency: 'SEK',
      interval: 'monthly',
      features: {
        maxResources: 10000,
        maxTeams: 100,
        maxMembersPerTeam: 100,
        maxStorageGB: 100,
        allowAdvancedPermissions: true,
        allowIntegrations: true,
        allowExport: true,
        prioritySupport: true
      }
    };

    return Result.ok([freePlan, proPlan, businessPlan]);
  }
} 