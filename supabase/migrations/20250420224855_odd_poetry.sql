/*
  # Add subscription helper functions
  
  1. New Functions
    - get_team_subscription: Get full subscription details for a team
    - check_subscription_limit: Check if team has reached a limit
    - get_subscription_usage: Get usage stats for a subscription
    - can_upgrade_tier: Check if team can upgrade to a tier
    
  2. Security
    - All functions use SECURITY DEFINER
    - Access controlled through RLS policies
*/

-- Function to get full subscription details
CREATE OR REPLACE FUNCTION get_team_subscription(team_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  tier subscription_tier,
  status subscription_status,
  period_start timestamptz,
  period_end timestamptz,
  cancel_at_period_end boolean,
  features json,
  usage json
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as subscription_id,
    s.tier,
    s.status,
    s.current_period_start as period_start,
    s.current_period_end as period_end,
    s.cancel_at_period_end,
    COALESCE(
      json_object_agg(
        si.feature, 
        json_build_object(
          'quantity', si.quantity,
          'used', COALESCE(
            (SELECT SUM(ur.quantity) 
             FROM usage_records ur 
             WHERE ur.team_id = s.team_id 
             AND ur.feature = si.feature
             AND ur.recorded_at >= s.current_period_start
             AND ur.recorded_at <= s.current_period_end),
            0
          )
        )
      ),
      '{}'::json
    ) as features,
    json_build_object(
      'total_members', (
        SELECT COUNT(*) 
        FROM team_members tm 
        WHERE tm.team_id = s.team_id
      )
    ) as usage
  FROM subscriptions s
  LEFT JOIN subscription_items si ON si.subscription_id = s.id
  WHERE s.team_id = team_id
  GROUP BY s.id;
END;
$$;

-- Function to check if team has reached a limit
CREATE OR REPLACE FUNCTION check_subscription_limit(
  team_id uuid,
  limit_type text,
  required_value integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_value integer;
BEGIN
  -- Get current value based on limit type
  CASE limit_type
    WHEN 'team_members' THEN
      SELECT COUNT(*) INTO current_value
      FROM team_members
      WHERE team_members.team_id = check_subscription_limit.team_id;
      
    WHEN 'monthly_sales' THEN
      SELECT COUNT(*) INTO current_value
      FROM sales s
      JOIN subscriptions sub ON sub.team_id = s.team_id
      WHERE s.team_id = check_subscription_limit.team_id
      AND s.created_at >= sub.current_period_start
      AND s.created_at <= sub.current_period_end;
      
    ELSE
      RETURN false;
  END CASE;
  
  -- Check if limit is reached (-1 means unlimited)
  RETURN required_value = -1 OR current_value < required_value;
END;
$$;

-- Function to get subscription usage for a period
CREATE OR REPLACE FUNCTION get_subscription_usage(
  team_id uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  feature text,
  quantity bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ur.feature,
    SUM(ur.quantity) as quantity
  FROM usage_records ur
  WHERE ur.team_id = get_subscription_usage.team_id
  AND ur.recorded_at >= start_date
  AND ur.recorded_at <= end_date
  GROUP BY ur.feature;
$$;

-- Function to check if team can upgrade to a tier
CREATE OR REPLACE FUNCTION can_upgrade_tier(
  team_id uuid,
  new_tier subscription_tier
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_tier subscription_tier;
  is_active boolean;
BEGIN
  -- Get current subscription status
  SELECT 
    s.tier,
    s.status = 'active' AND s.current_period_end > now()
  INTO current_tier, is_active
  FROM subscriptions s
  WHERE s.team_id = can_upgrade_tier.team_id;
  
  -- Can't upgrade if no active subscription
  IF NOT is_active THEN
    RETURN false;
  END IF;
  
  -- Check tier hierarchy
  RETURN CASE new_tier
    WHEN 'free' THEN true
    WHEN 'pro' THEN current_tier = 'free'
    WHEN 'business' THEN current_tier IN ('free', 'pro')
    WHEN 'enterprise' THEN current_tier IN ('free', 'pro', 'business')
    ELSE false
  END;
END;
$$;