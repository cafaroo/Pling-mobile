/**
 * Prenumerationstyper och värde-objekt
 */

/**
 * Status för en prenumeration
 */
export enum SubscriptionStatus {
  PENDING = 'pending',        // Väntar på aktivering
  ACTIVE = 'active',          // Aktiv prenumeration
  PAST_DUE = 'past_due',      // Betalningsproblem
  CANCELED = 'canceled',      // Avslutad prenumeration
  TRIALING = 'trialing',      // I provperiod
  INCOMPLETE = 'incomplete',  // Ofullständig/avbruten betalning
  UNPAID = 'unpaid'           // Obetald
}

/**
 * Prenumerations-/betalningsprovider
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  MANUAL = 'manual'
}

/**
 * Betalningsperiod
 */
export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  QUARTERLY = 'quarterly'
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
 * Information om prenumerationsbegränsningar
 */
export interface SubscriptionLimits {
  teamMembers: number;       // Max antal teammedlemmar
  mediaStorage: number;      // Max lagringsutrymme i MB
  teamCount: number;         // Max antal team
  projectsPerTeam: number;   // Max antal projekt per team
  [key: string]: number;     // Övriga begränsningar
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