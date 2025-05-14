export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';

type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface Subscription {
  id: string;
  teamId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  feature: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface UsageRecord {
  id: string;
  teamId: string;
  feature: string;
  quantity: number;
  recordedAt: string;
}

export interface TierLimits {
  maxTeamMembers: number;
  maxSalesPerMonth: number;
  features: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxTeamMembers: 3,
    maxSalesPerMonth: 50,
    features: ['basic_sales', 'basic_leaderboard', 'basic_analytics'],
  },
  pro: {
    maxTeamMembers: 10,
    maxSalesPerMonth: -1, // unlimited
    features: [
      'advanced_sales',
      'full_leaderboard',
      'advanced_analytics',
      'export',
      'team_chat',
      'custom_competitions',
    ],
  },
  business: {
    maxTeamMembers: 25,
    maxSalesPerMonth: -1,
    features: [
      'api_access',
      'advanced_hierarchy',
      'multiple_teams',
      'custom_reports',
      'sso',
      'advanced_permissions',
      'sales_forecasting',
      'crm_integration',
    ],
  },
  enterprise: {
    maxTeamMembers: -1, // unlimited
    maxSalesPerMonth: -1,
    features: [
      'custom_development',
      'on_premise',
      'custom_analytics',
      'custom_integrations',
      'training',
      'sla',
    ],
  },
};