export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface SubscriptionUsage {
  teamMembers: number;
  mediaStorage: number;
  apiRequests?: number;
  lastUpdated: Date;
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

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

export const isActiveSubscriptionStatus = (status: SubscriptionStatus): boolean => {
  return ['active', 'trialing'].includes(status);
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