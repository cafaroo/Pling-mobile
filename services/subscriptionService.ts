import { supabase } from './supabaseClient';
import { Subscription, SubscriptionTier, TierLimits, TIER_LIMITS } from '@/types/subscription';

// Get team's subscription
export const getTeamSubscription = async (teamId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_team_subscription_safe', { p_team_id: teamId });

    if (error) throw error;

    if (!data || data.length === 0) return null;
    
    // First row contains the subscription data
    const subscription = data[0];
    
    return {
      id: data.id,
      teamId: data.team_id,
      tier: data.tier,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error getting team subscription:', error);
    return null;
  }
};

// Check if team has access to a feature
export const checkFeatureAccess = async (teamId: string, feature: string): Promise<boolean> => {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('team_id', teamId)
      .single();

    if (!subscription || 
        subscription.status !== 'active' || 
        new Date(subscription.current_period_end) < new Date()) {
      return false;
    }

    const tierLimits = TIER_LIMITS[subscription.tier as SubscriptionTier];
    return tierLimits.features.includes(feature);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};

// Check if team has reached member limit
const checkTeamMemberLimit = async (teamId: string): Promise<boolean> => {
  try {
    // Get subscription and current member count
    const [subscription, { count }] = await Promise.all([
      getTeamSubscription(teamId),
      supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId),
    ]);

    if (!subscription || !count) return false;

    const limits = TIER_LIMITS[subscription.tier];
    return limits.maxTeamMembers === -1 || count < limits.maxTeamMembers;
  } catch (error) {
    console.error('Error checking team member limit:', error);
    return false;
  }
};

// Record feature usage
const recordUsage = async (teamId: string, feature: string, quantity: number = 1): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('usage_records')
      .insert({
        team_id: teamId,
        feature,
        quantity,
      });

    return !error;
  } catch (error) {
    console.error('Error recording usage:', error);
    return false;
  }
};

// Get current usage for a feature
const getFeatureUsage = async (teamId: string, feature: string, period: 'day' | 'month' = 'month'): Promise<number> => {
  try {
    const startDate = new Date();
    if (period === 'month') {
      startDate.setDate(1);
    }
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_records')
      .select('quantity')
      .eq('team_id', teamId)
      .eq('feature', feature)
      .gte('recorded_at', startDate.toISOString());

    if (error) throw error;

    return data.reduce((sum, record) => sum + record.quantity, 0);
  } catch (error) {
    console.error('Error getting feature usage:', error);
    return 0;
  }
};