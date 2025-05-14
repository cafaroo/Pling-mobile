/*
  # Add subscription system

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `tier` (text, check constraint for valid tiers)
      - `status` (text, check constraint for valid statuses)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `subscription_items`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, references subscriptions)
      - `feature` (text)
      - `quantity` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `usage_records`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `feature` (text)
      - `quantity` (integer)
      - `recorded_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for team access
    - Add function to check subscription tier
*/

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start timestamptz NOT NULL DEFAULT now(),
    current_period_end timestamptz NOT NULL DEFAULT now() + interval '1 month',
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(team_id)
);

-- Create subscription items table
CREATE TABLE IF NOT EXISTS public.subscription_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    feature text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create usage records table
CREATE TABLE IF NOT EXISTS public.usage_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    feature text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    recorded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Create function to check subscription tier
CREATE OR REPLACE FUNCTION check_subscription_tier(team_id uuid, required_tier subscription_tier)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE subscriptions.team_id = team_id
    AND subscriptions.tier >= required_tier
    AND subscriptions.status = 'active'
    AND subscriptions.current_period_end > now()
  );
$$;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(team_id uuid, feature text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM subscriptions s
    JOIN subscription_items si ON si.subscription_id = s.id
    WHERE s.team_id = team_id
    AND s.status = 'active'
    AND s.current_period_end > now()
    AND si.feature = feature
    AND si.quantity > 0
  );
$$;

-- Create policies for subscriptions
CREATE POLICY "Team members can view subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (check_team_member(team_id));

CREATE POLICY "Team leaders can manage subscription"
ON subscriptions
FOR ALL
TO authenticated
USING (check_team_leader(team_id))
WITH CHECK (check_team_leader(team_id));

-- Create policies for subscription items
CREATE POLICY "Team members can view subscription items"
ON subscription_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id
    AND check_team_member(s.team_id)
  )
);

-- Create policies for usage records
CREATE POLICY "Team members can view usage"
ON usage_records
FOR SELECT
TO authenticated
USING (check_team_member(team_id));

CREATE POLICY "Team members can record usage"
ON usage_records
FOR INSERT
TO authenticated
WITH CHECK (check_team_member(team_id));

-- Create updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_items_updated_at
    BEFORE UPDATE ON public.subscription_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to create free subscription for new teams
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (team_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_team_created
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION create_free_subscription();