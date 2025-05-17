/**
 * SubscriptionTypes: Prenumerationstyper för applikationen
 */

/**
 * SubscriptionPlan representerar de olika prenumerationsplaner som finns tillgängliga
 */
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

/**
 * SubscriptionStatus representerar de olika tillstånd en prenumeration kan ha
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  EXPIRED = 'expired'
}

/**
 * BillingCycle representerar de olika faktureringsperioderna
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

/**
 * SubscriptionLimits representerar begränsningar för olika prenumerationsplaner
 */
export interface SubscriptionLimits {
  maxTeams: number;
  maxMembersPerTeam: number;
  maxFileSizeMB: number;
  maxStorageGB: number;
  allowedFeatures: string[];
}

/**
 * Baserade på prenumerationsplanen, returnera motsvarande gränser
 */
export function getSubscriptionLimits(plan: SubscriptionPlan): SubscriptionLimits {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return {
        maxTeams: 1,
        maxMembersPerTeam: 5,
        maxFileSizeMB: 5,
        maxStorageGB: 1,
        allowedFeatures: ['basic_messaging', 'basic_tasks']
      };
    case SubscriptionPlan.BASIC:
      return {
        maxTeams: 3,
        maxMembersPerTeam: 10,
        maxFileSizeMB: 25,
        maxStorageGB: 5,
        allowedFeatures: ['basic_messaging', 'basic_tasks', 'file_sharing', 'basic_analytics']
      };
    case SubscriptionPlan.STANDARD:
      return {
        maxTeams: 10,
        maxMembersPerTeam: 25,
        maxFileSizeMB: 100,
        maxStorageGB: 20,
        allowedFeatures: [
          'basic_messaging', 'basic_tasks', 'file_sharing', 'basic_analytics',
          'advanced_messaging', 'advanced_tasks', 'integrations'
        ]
      };
    case SubscriptionPlan.PREMIUM:
      return {
        maxTeams: 25,
        maxMembersPerTeam: 100,
        maxFileSizeMB: 500,
        maxStorageGB: 100,
        allowedFeatures: [
          'basic_messaging', 'basic_tasks', 'file_sharing', 'basic_analytics',
          'advanced_messaging', 'advanced_tasks', 'integrations',
          'advanced_analytics', 'premium_support', 'advanced_security'
        ]
      };
    case SubscriptionPlan.ENTERPRISE:
      return {
        maxTeams: -1, // Obegränsat
        maxMembersPerTeam: -1, // Obegränsat
        maxFileSizeMB: 2048,
        maxStorageGB: 1024,
        allowedFeatures: [
          'basic_messaging', 'basic_tasks', 'file_sharing', 'basic_analytics',
          'advanced_messaging', 'advanced_tasks', 'integrations',
          'advanced_analytics', 'premium_support', 'advanced_security',
          'dedicated_support', 'custom_integrations', 'sso', 'audit_logs'
        ]
      };
    default:
      return {
        maxTeams: 0,
        maxMembersPerTeam: 0,
        maxFileSizeMB: 0,
        maxStorageGB: 0,
        allowedFeatures: []
      };
  }
}

/**
 * Kontrollera om en funktion är tillgänglig för en given prenumerationsplan
 */
export function isFeatureAvailable(plan: SubscriptionPlan, featureName: string): boolean {
  const limits = getSubscriptionLimits(plan);
  return limits.allowedFeatures.includes(featureName);
}

/**
 * Returnera priset för varje prenumerationsplan
 */
export function getSubscriptionPrice(plan: SubscriptionPlan, cycle: BillingCycle = BillingCycle.MONTHLY): number {
  const basePrice = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.BASIC]: 9.99,
    [SubscriptionPlan.STANDARD]: 19.99,
    [SubscriptionPlan.PREMIUM]: 49.99,
    [SubscriptionPlan.ENTERPRISE]: 99.99
  }[plan];

  // Applicera rabatter för längre prenumerationsperioder
  const multiplier = {
    [BillingCycle.MONTHLY]: 1,
    [BillingCycle.QUARTERLY]: 2.7, // 10% rabatt för kvartal
    [BillingCycle.YEARLY]: 10 // 17% rabatt för år
  }[cycle];

  return basePrice * multiplier;
} 