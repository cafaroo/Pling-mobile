export type PlanTier = 'basic' | 'pro' | 'enterprise';

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: PlanTier;
}

export interface PlanLimits {
  teamMembers: number;
  mediaStorage: number; // i megabytes
  customDashboards: number;
  apiRequests?: number; // per månad
  concurrentUsers?: number;
}

export const isFeatureAvailableForTier = (
  feature: PlanFeature, 
  tier: PlanTier
): boolean => {
  const tierOrder: Record<PlanTier, number> = {
    'basic': 1,
    'pro': 2,
    'enterprise': 3
  };
  
  return feature.enabled && tierOrder[tier] >= tierOrder[feature.tier];
};

export const getPlanTierFromName = (name: string): PlanTier => {
  switch (name.toLowerCase()) {
    case 'basic':
      return 'basic';
    case 'pro':
      return 'pro';
    case 'enterprise':
      return 'enterprise';
    default:
      return 'basic';
  }
};

export const getTierDisplayName = (tier: PlanTier): string => {
  switch (tier) {
    case 'basic':
      return 'Basic';
    case 'pro':
      return 'Pro';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Okänd';
  }
}; 