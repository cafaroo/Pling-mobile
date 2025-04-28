/*
  # Add subscription management functions
  
  1. New Functions
    - `get_subscription_status`: Get detailed subscription status
    - `check_subscription_access`: Check if team has access to specific features
    - `sync_subscription_items`: Sync subscription items with tier features
    
  2. Security
    - All functions use SECURITY DEFINER
    - Access controlled through RLS policies
*/

-- Function to get detailed subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(team_id uuid)
RETURNS TABLE (
  is_active boolean,
  days_remaining integer,
  features_used json,
  limits_reached text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get subscription
  SELECT * INTO subscription_record
  FROM subscriptions s
  WHERE s.team_id = get_subscription_status.team_id;
  
  RETURN QUERY
  SELECT 
    -- Active status
    subscription_record.status = 'active' 
    AND subscription_record.current_period_end > now()
    AND NOT subscription_record.cancel_at_period_end,
    
    -- Days remaining
    EXTRACT(DAY FROM (subscription_record.current_period_end - now()))::integer,
    
    -- Features usage
    (
      SELECT json_object_agg(
        ur.feature,
        json_build_object(
          'total', SUM(ur.quantity),
          'last_used', max(ur.recorded_at)
        )
      )
      FROM usage_records ur
      WHERE ur.team_id = get_subscription_status.team_id
      AND ur.recorded_at >= subscription_record.current_period_start
      GROUP BY ur.feature
    ),
    
    -- Limits reached
    ARRAY(
      SELECT f.feature
      FROM get_available_features(subscription_record.tier) f
      WHERE f.limit_type = 'count'
      AND f.limit_value > 0
      AND (
        SELECT COALESCE(SUM(quantity), 0)
        FROM usage_records ur
        WHERE ur.team_id = get_subscription_status.team_id
        AND ur.feature = f.feature
        AND ur.recorded_at >= subscription_record.current_period_start
      ) >= f.limit_value
    );
END;
$$;

-- Function to check subscription access
CREATE OR REPLACE FUNCTION check_subscription_access(
  team_id uuid,
  required_features text[]
)
RETURNS TABLE (
  has_access boolean,
  missing_features text[],
  upgrade_required boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  subscription_record record;
  next_tier subscription_tier;
BEGIN
  -- Get subscription
  SELECT * INTO subscription_record
  FROM subscriptions s
  WHERE s.team_id = check_subscription_access.team_id;
  
  -- Get missing features
  WITH feature_check AS (
    SELECT feature
    FROM unnest(required_features) feature
    WHERE NOT check_feature_limit(team_id, feature)
  )
  SELECT 
    -- Has access if no missing features
    ARRAY_LENGTH(ARRAY_AGG(feature), 1) IS NULL,
    -- List of missing features
    ARRAY_AGG(feature),
    -- Upgrade required if any feature available in higher tier
    EXISTS (
      SELECT 1
      FROM get_available_features(
        CASE subscription_record.tier
          WHEN 'free' THEN 'pro'::subscription_tier
          WHEN 'pro' THEN 'business'::subscription_tier
          WHEN 'business' THEN 'enterprise'::subscription_tier
          ELSE subscription_record.tier
        END
      ) f
      WHERE f.feature = ANY(ARRAY_AGG(feature))
    )
  INTO has_access, missing_features, upgrade_required
  FROM feature_check;
  
  RETURN NEXT;
END;
$$;

-- Function to sync subscription items
CREATE OR REPLACE FUNCTION sync_subscription_items(subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get subscription
  SELECT * INTO subscription_record
  FROM subscriptions s
  WHERE s.id = sync_subscription_items.subscription_id;
  
  -- Delete existing items
  DELETE FROM subscription_items
  WHERE subscription_id = sync_subscription_items.subscription_id;
  
  -- Insert new items based on tier features
  INSERT INTO subscription_items (subscription_id, feature, quantity)
  SELECT 
    subscription_record.id,
    feature,
    CASE limit_type
      WHEN 'boolean' THEN 1
      ELSE limit_value
    END
  FROM get_available_features(subscription_record.tier)
  WHERE limit_type = 'boolean' OR limit_value > 0;
  
  RETURN true;
END;
$$;

-- Function to get subscription recommendations
CREATE OR REPLACE FUNCTION get_subscription_recommendations(
  team_id uuid
)
RETURNS TABLE (
  recommended_tier subscription_tier,
  reason text,
  cost_savings numeric,
  missing_features text[],
  upgrade_benefits json
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_subscription record;
  usage_patterns record;
BEGIN
  -- Get current subscription
  SELECT * INTO current_subscription
  FROM subscriptions s
  WHERE s.team_id = get_subscription_recommendations.team_id;
  
  -- Analyze usage patterns
  WITH feature_usage AS (
    SELECT 
      feature,
      SUM(quantity) as total_usage,
      COUNT(DISTINCT DATE_TRUNC('day', recorded_at)) as days_used
    FROM usage_records ur
    WHERE ur.team_id = get_subscription_recommendations.team_id
    AND ur.recorded_at >= current_subscription.current_period_start
    GROUP BY feature
  )
  SELECT 
    MAX(total_usage) as max_usage,
    AVG(days_used) as avg_daily_usage
  INTO usage_patterns
  FROM feature_usage;
  
  -- Generate recommendations
  RETURN QUERY
  SELECT
    CASE current_subscription.tier
      WHEN 'free' THEN 
        CASE 
          WHEN usage_patterns.max_usage > 40 THEN 'pro'::subscription_tier
          ELSE 'free'::subscription_tier
        END
      WHEN 'pro' THEN
        CASE 
          WHEN usage_patterns.avg_daily_usage > 20 THEN 'business'::subscription_tier
          ELSE 'pro'::subscription_tier
        END
      ELSE current_subscription.tier
    END as recommended_tier,
    
    CASE 
      WHEN usage_patterns.max_usage > 40 AND current_subscription.tier = 'free' 
      THEN 'High usage indicates need for Pro features'
      WHEN usage_patterns.avg_daily_usage > 20 AND current_subscription.tier = 'pro'
      THEN 'Usage patterns suggest Business tier would be more cost-effective'
      ELSE 'Current tier matches usage patterns'
    END as reason,
    
    CASE 
      WHEN usage_patterns.max_usage > 40 AND current_subscription.tier = 'free' 
      THEN usage_patterns.max_usage * 0.1
      WHEN usage_patterns.avg_daily_usage > 20 AND current_subscription.tier = 'pro'
      THEN usage_patterns.avg_daily_usage * 0.2
      ELSE 0
    END as cost_savings,
    
    ARRAY(
      SELECT f.feature
      FROM get_available_features(
        CASE current_subscription.tier
          WHEN 'free' THEN 'pro'::subscription_tier
          WHEN 'pro' THEN 'business'::subscription_tier
          ELSE current_subscription.tier
        END
      ) f
      WHERE NOT EXISTS (
        SELECT 1 FROM subscription_items si
        WHERE si.subscription_id = current_subscription.id
        AND si.feature = f.feature
      )
    ) as missing_features,
    
    json_build_object(
      'increased_limits', usage_patterns.max_usage > 40,
      'advanced_features', usage_patterns.avg_daily_usage > 20,
      'cost_effective', usage_patterns.max_usage * usage_patterns.avg_daily_usage > 1000
    ) as upgrade_benefits;
END;
$$;