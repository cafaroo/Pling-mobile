/*
  # Add subscription management functions
  
  1. New Functions
    - upgrade_subscription: Upgrade a team's subscription to a new tier
    - cancel_subscription: Cancel a team's subscription
    - reactivate_subscription: Reactivate a canceled subscription
    
  2. Security
    - All functions use SECURITY DEFINER
    - Access controlled through RLS policies
*/

-- Function to upgrade subscription
CREATE OR REPLACE FUNCTION upgrade_subscription(
  team_id uuid,
  new_tier subscription_tier
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_subscription record;
BEGIN
  -- Get current subscription
  SELECT * INTO current_subscription
  FROM subscriptions
  WHERE subscriptions.team_id = upgrade_subscription.team_id;
  
  -- Check if upgrade is allowed
  IF NOT can_upgrade_tier(team_id, new_tier) THEN
    RETURN false;
  END IF;
  
  -- Update subscription
  UPDATE subscriptions
  SET 
    tier = new_tier,
    status = 'active',
    cancel_at_period_end = false,
    updated_at = now()
  WHERE team_id = upgrade_subscription.team_id;
  
  -- Clear any existing subscription items
  DELETE FROM subscription_items
  WHERE subscription_id = current_subscription.id;
  
  -- Add new subscription items based on tier features
  INSERT INTO subscription_items (subscription_id, feature, quantity)
  SELECT 
    current_subscription.id,
    feature,
    CASE limit_type
      WHEN 'boolean' THEN 1
      ELSE limit_value
    END as quantity
  FROM get_available_features(new_tier)
  WHERE limit_type = 'boolean' OR limit_value > 0;
  
  RETURN true;
END;
$$;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  team_id uuid,
  immediate boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF immediate THEN
    -- Immediately cancel subscription
    UPDATE subscriptions
    SET 
      status = 'canceled',
      cancel_at_period_end = false,
      current_period_end = now(),
      updated_at = now()
    WHERE subscriptions.team_id = cancel_subscription.team_id
    AND status != 'canceled';
  ELSE
    -- Cancel at period end
    UPDATE subscriptions
    SET 
      cancel_at_period_end = true,
      updated_at = now()
    WHERE subscriptions.team_id = cancel_subscription.team_id
    AND status = 'active';
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Function to reactivate subscription
CREATE OR REPLACE FUNCTION reactivate_subscription(
  team_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get current subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE subscriptions.team_id = reactivate_subscription.team_id;
  
  -- Can't reactivate if no subscription exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Can't reactivate if period has ended
  IF subscription_record.status = 'canceled' AND subscription_record.current_period_end < now() THEN
    RETURN false;
  END IF;
  
  -- Reactivate subscription
  UPDATE subscriptions
  SET 
    status = 'active',
    cancel_at_period_end = false,
    updated_at = now()
  WHERE id = subscription_record.id;
  
  RETURN true;
END;
$$;

-- Function to extend subscription period
CREATE OR REPLACE FUNCTION extend_subscription_period(
  team_id uuid,
  months integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get current subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE subscriptions.team_id = extend_subscription_period.team_id;
  
  -- Can't extend if no subscription exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Extend subscription period
  UPDATE subscriptions
  SET 
    current_period_end = GREATEST(current_period_end, now()) + (months || ' months')::interval,
    status = 'active',
    cancel_at_period_end = false,
    updated_at = now()
  WHERE id = subscription_record.id;
  
  RETURN true;
END;
$$;