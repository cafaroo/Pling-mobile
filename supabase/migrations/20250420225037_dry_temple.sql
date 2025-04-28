/*
  # Add subscription feature management functions
  
  1. New Functions
    - get_available_features: Get all features available for a tier
    - check_feature_limit: Check if a feature has reached its limit
    - record_feature_usage: Record usage of a feature
    - get_feature_usage_summary: Get usage summary for all features
    
  2. Security
    - All functions use SECURITY DEFINER
    - Access controlled through RLS policies
*/

-- Function to get available features for a tier
CREATE OR REPLACE FUNCTION get_available_features(tier_name subscription_tier)
RETURNS TABLE (
  feature text,
  limit_type text,
  limit_value integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH tier_features AS (
    SELECT 
      CASE tier_name
        WHEN 'free' THEN 
          ARRAY[
            ROW('team_members', 'count', 3),
            ROW('monthly_sales', 'count', 50),
            ROW('basic_analytics', 'boolean', 1)
          ]
        WHEN 'pro' THEN 
          ARRAY[
            ROW('team_members', 'count', 10),
            ROW('monthly_sales', 'count', -1),
            ROW('advanced_analytics', 'boolean', 1),
            ROW('export', 'boolean', 1),
            ROW('team_chat', 'boolean', 1),
            ROW('custom_competitions', 'boolean', 1)
          ]
        WHEN 'business' THEN 
          ARRAY[
            ROW('team_members', 'count', 25),
            ROW('monthly_sales', 'count', -1),
            ROW('advanced_analytics', 'boolean', 1),
            ROW('export', 'boolean', 1),
            ROW('team_chat', 'boolean', 1),
            ROW('custom_competitions', 'boolean', 1),
            ROW('api_access', 'boolean', 1),
            ROW('advanced_hierarchy', 'boolean', 1),
            ROW('multiple_teams', 'boolean', 1),
            ROW('custom_reports', 'boolean', 1),
            ROW('sso', 'boolean', 1),
            ROW('advanced_permissions', 'boolean', 1),
            ROW('sales_forecasting', 'boolean', 1),
            ROW('crm_integration', 'boolean', 1)
          ]
        WHEN 'enterprise' THEN 
          ARRAY[
            ROW('team_members', 'count', -1),
            ROW('monthly_sales', 'count', -1),
            ROW('advanced_analytics', 'boolean', 1),
            ROW('export', 'boolean', 1),
            ROW('team_chat', 'boolean', 1),
            ROW('custom_competitions', 'boolean', 1),
            ROW('api_access', 'boolean', 1),
            ROW('advanced_hierarchy', 'boolean', 1),
            ROW('multiple_teams', 'boolean', 1),
            ROW('custom_reports', 'boolean', 1),
            ROW('sso', 'boolean', 1),
            ROW('advanced_permissions', 'boolean', 1),
            ROW('sales_forecasting', 'boolean', 1),
            ROW('crm_integration', 'boolean', 1),
            ROW('custom_development', 'boolean', 1),
            ROW('on_premise', 'boolean', 1),
            ROW('custom_analytics', 'boolean', 1),
            ROW('custom_integrations', 'boolean', 1),
            ROW('training', 'boolean', 1),
            ROW('sla', 'boolean', 1)
          ]
      END AS features
  )
  SELECT 
    f.column1 as feature,
    f.column2 as limit_type,
    f.column3 as limit_value
  FROM tier_features,
  UNNEST(features) AS f(column1 text, column2 text, column3 integer);
$$;

-- Function to check if a feature has reached its limit
CREATE OR REPLACE FUNCTION check_feature_limit(
  team_id uuid,
  feature_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  feature_record record;
  current_usage integer;
BEGIN
  -- Get feature details for team's tier
  SELECT f.* INTO feature_record
  FROM subscriptions s
  CROSS JOIN LATERAL get_available_features(s.tier) f
  WHERE s.team_id = check_feature_limit.team_id
  AND f.feature = feature_name;
  
  -- Feature not available for tier
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Boolean features are always available if present
  IF feature_record.limit_type = 'boolean' THEN
    RETURN true;
  END IF;
  
  -- Check count-based limits
  IF feature_record.limit_type = 'count' THEN
    -- Unlimited (-1) has no limit
    IF feature_record.limit_value = -1 THEN
      RETURN true;
    END IF;
    
    -- Get current usage
    SELECT COALESCE(SUM(quantity), 0) INTO current_usage
    FROM usage_records
    WHERE team_id = check_feature_limit.team_id
    AND feature = feature_name;
    
    RETURN current_usage < feature_record.limit_value;
  END IF;
  
  -- Unknown limit type
  RETURN false;
END;
$$;

-- Function to record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(
  team_id uuid,
  feature_name text,
  quantity integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if feature is available and within limits
  IF NOT check_feature_limit(team_id, feature_name) THEN
    RETURN false;
  END IF;
  
  -- Record usage
  INSERT INTO usage_records (team_id, feature, quantity)
  VALUES (team_id, feature_name, quantity);
  
  RETURN true;
END;
$$;

-- Function to get feature usage summary
CREATE OR REPLACE FUNCTION get_feature_usage_summary(
  team_id uuid,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  feature text,
  total_usage bigint,
  limit_type text,
  limit_value integer,
  percentage_used numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Use subscription period if dates not provided
  IF start_date IS NULL THEN
    SELECT current_period_start INTO start_date
    FROM subscriptions
    WHERE team_id = get_feature_usage_summary.team_id;
  END IF;
  
  IF end_date IS NULL THEN
    SELECT current_period_end INTO end_date
    FROM subscriptions
    WHERE team_id = get_feature_usage_summary.team_id;
  END IF;
  
  RETURN QUERY
  WITH usage_stats AS (
    SELECT 
      ur.feature,
      COALESCE(SUM(ur.quantity), 0) as total_usage
    FROM usage_records ur
    WHERE ur.team_id = get_feature_usage_summary.team_id
    AND ur.recorded_at >= start_date
    AND ur.recorded_at <= end_date
    GROUP BY ur.feature
  )
  SELECT
    f.feature,
    COALESCE(us.total_usage, 0) as total_usage,
    f.limit_type,
    f.limit_value,
    CASE
      WHEN f.limit_type = 'boolean' THEN 100
      WHEN f.limit_value = -1 THEN 0
      ELSE ROUND((COALESCE(us.total_usage, 0)::numeric / f.limit_value::numeric) * 100, 2)
    END as percentage_used
  FROM subscriptions s
  CROSS JOIN LATERAL get_available_features(s.tier) f
  LEFT JOIN usage_stats us ON us.feature = f.feature
  WHERE s.team_id = get_feature_usage_summary.team_id;
END;
$$;