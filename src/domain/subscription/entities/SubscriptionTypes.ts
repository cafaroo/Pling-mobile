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
  EXPIRED = 'expired',
  CANCELED = 'canceled',       // För bakåtkompatibilitet med canceled-stavning
  TRIALING = 'trialing',       // För bakåtkompatibilitet med trialing
  INCOMPLETE = 'incomplete',   // För bakåtkompatibilitet med incomplete
  UNPAID = 'unpaid'            // För bakåtkompatibilitet med unpaid
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
 * Prenumerations-/betalningsprovider
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  MANUAL = 'manual'
}

/**
 * Användningsinformation för prenumeration
 */
export interface SubscriptionUsage {
  teamMembers: number;       // Antal teammedlemmar
  mediaStorage: number;      // Använt utrymme i MB
  lastUpdated: Date;         // Senaste uppdateringen av användningsinformation
  [key: string]: any;        // Övriga mätvärden
}

/**
 * Faktureringsinformation
 */
export interface BillingAddress {
  street: string;           // Gatuadress
  city: string;             // Stad
  state: string;            // Stat/Provins
  postalCode: string;       // Postnummer
  country: string;          // Land
}

/**
 * Funktionalitet som ingår i prenumerationsplan
 */
export interface FeatureFlag {
  id: string;              // Funktions-ID
  name: string;            // Visningsnamn
  description: string;     // Beskrivning
  enabled: boolean;        // Om funktionen är aktiverad
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
  teamMembers?: number;     // Bakåtkompatibilitet
  mediaStorage?: number;    // Bakåtkompatibilitet
  teamCount?: number;       // Bakåtkompatibilitet
  projectsPerTeam?: number; // Bakåtkompatibilitet
  [key: string]: any;       // Övriga begränsningar
}

/**
 * Metod för att kontrollera om en status anses vara "aktiv"
 */
export function isActiveStatus(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}

/**
 * Metod för att konvertera Stripe-status till vårt interna format
 */
export function mapStripeStatusToInternal(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.CANCELED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

export const getSubscriptionStatusDisplayName = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'Aktiv';
    case 'trialing':
      return 'Provperiod';
    case 'past_due':
      return 'Förfallen betalning';
    case 'canceled':
      return 'Avslutad';
    case 'incomplete':
      return 'Ofullständig';
    case 'incomplete_expired':
      return 'Ofullständig (utgången)';
    case 'unpaid':
      return 'Obetald';
    default:
      return 'Okänd';
  }
};

export const getSubscriptionStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return '#4CAF50'; // Grön
    case 'trialing':
      return '#2196F3'; // Blå
    case 'past_due':
      return '#FF9800'; // Orange
    case 'canceled':
      return '#9E9E9E'; // Grå
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
      return '#F44336'; // Röd
    default:
      return '#9E9E9E'; // Grå
  }
};

export const formatCurrency = (amount: number, currency: string = 'SEK'): string => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatStorageSize = (sizeInMB: number): string => {
  if (sizeInMB < 1000) {
    return `${sizeInMB} MB`;
  } else {
    const sizeInGB = sizeInMB / 1024;
    return `${sizeInGB.toFixed(1)} GB`;
  }
};

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