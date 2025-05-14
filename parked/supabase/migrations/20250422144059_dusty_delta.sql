/*
  # Fix subscription query issues
  
  1. Changes
    - Add function to safely get team subscription
    - Handle case when no subscription exists
    - Return default free tier when no subscription found
    
  2. Security
    - Maintain RLS policies
    - Use security definer for consistent access
*/

-- Function to safely get team subscription with fallback to free tier
CREATE OR REPLACE FUNCTION get_team_subscription_safe(p_team_id uuid)
RETURNS TABLE (
  id uuid,
  team_id uuid,
  tier subscription_tier,
  status subscription_status,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- First try to get existing subscription
  RETURN QUERY
  SELECT s.*
  FROM subscriptions s
  WHERE s.team_id = p_team_id;
  
  -- If no rows returned, create a virtual free subscription
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      gen_random_uuid() as id,
      p_team_id,
      'free'::subscription_tier as tier,
      'active'::subscription_status as status,
      now() as current_period_start,
      (now() + interval '1 month') as current_period_end,
      false as cancel_at_period_end,
      now() as created_at,
      now() as updated_at;
  END IF;
END;
$$;

-- Create trigger to ensure every team has a subscription
CREATE OR REPLACE FUNCTION ensure_team_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if subscription exists
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE team_id = NEW.id
  ) THEN
    -- Create free subscription
    INSERT INTO subscriptions (
      team_id,
      tier,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      'free',
      'active',
      now(),
      now() + interval '1 month'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'ensure_team_has_subscription'
  ) THEN
    CREATE TRIGGER ensure_team_has_subscription
      AFTER INSERT ON teams
      FOR EACH ROW
      EXECUTE FUNCTION ensure_team_subscription();
  END IF;
END $$;

-- Create missing subscriptions for existing teams
INSERT INTO subscriptions (
  team_id,
  tier,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  t.id,
  'free'::subscription_tier,
  'active'::subscription_status,
  now(),
  now() + interval '1 month'
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.team_id = t.id
);