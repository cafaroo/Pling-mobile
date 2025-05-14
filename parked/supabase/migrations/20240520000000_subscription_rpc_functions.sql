-- Skapa eller uppdatera prenumerationsstatistiktabell
CREATE TABLE IF NOT EXISTS subscription_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  statistics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC-funktion för att hämta statistik per plan
CREATE OR REPLACE FUNCTION get_subscription_stats_by_plan()
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  active_count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    p.id AS plan_id,
    p.name AS plan_name,
    COUNT(s.id) AS active_count
  FROM 
    subscriptions s
  JOIN 
    subscription_plans p ON s.plan_id = p.id
  WHERE 
    s.status = 'active'
  GROUP BY 
    p.id, p.name;
$$;

-- RPC-funktion för att beräkna månadsvis återkommande intäkt (MRR)
CREATE OR REPLACE FUNCTION calculate_monthly_recurring_revenue()
RETURNS TABLE (
  mrr NUMERIC,
  currency TEXT
) LANGUAGE SQL SECURITY DEFINER AS $$
  WITH subscription_mrr AS (
    SELECT
      SUM(
        CASE 
          -- Månadsplaner räknas direkt
          WHEN sp.billing_interval = 'month' THEN sp.price
          -- Årsplaner delas med 12 för att få månadskostnad
          WHEN sp.billing_interval = 'year' THEN sp.price / 12
          ELSE 0
        END
      ) AS total_mrr,
      sp.currency
    FROM
      subscriptions s
    JOIN
      subscription_plans sp ON s.plan_id = sp.id
    WHERE
      s.status = 'active'
    GROUP BY
      sp.currency
  )
  SELECT 
    COALESCE(total_mrr, 0) AS mrr,
    COALESCE(currency, 'SEK') AS currency
  FROM
    subscription_mrr;
$$;

-- RPC-funktion för att få prenumerationer som snart förnyas
CREATE OR REPLACE FUNCTION get_upcoming_renewals(days_threshold INTEGER)
RETURNS SETOF subscriptions LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT *
  FROM subscriptions
  WHERE 
    status = 'active'
    AND current_period_end <= (NOW() + (days_threshold || ' days')::INTERVAL)
    AND cancel_at_period_end = false;
$$;

-- RPC-funktion för att få prenumerationer som snart upphör
CREATE OR REPLACE FUNCTION get_upcoming_expirations(days_threshold INTEGER)
RETURNS SETOF subscriptions LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT *
  FROM subscriptions
  WHERE 
    status = 'active'
    AND current_period_end <= (NOW() + (days_threshold || ' days')::INTERVAL)
    AND cancel_at_period_end = true;
$$;

-- RPC-funktion för att markera utgångna prenumerationer som avslutade
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  processed_count INTEGER;
BEGIN
  WITH updated_subscriptions AS (
    UPDATE subscriptions
    SET 
      status = 'canceled',
      updated_at = NOW()
    WHERE 
      status = 'active'
      AND cancel_at_period_end = true
      AND current_period_end < NOW()
    RETURNING id
  ),
  history_entries AS (
    INSERT INTO subscription_history (
      subscription_id,
      event_type,
      event_data,
      created_at
    )
    SELECT 
      id,
      'subscription_expired',
      jsonb_build_object(
        'processed_at', NOW()::TEXT
      ),
      NOW()
    FROM updated_subscriptions
  )
  SELECT COUNT(*) INTO processed_count FROM updated_subscriptions;
  
  RETURN processed_count;
END;
$$;

-- Sätt upp RLS-policyer för tabellerna
ALTER TABLE subscription_statistics ENABLE ROW LEVEL SECURITY;

-- Endast administratörer kan skriva till statistiktabellen
CREATE POLICY "Admin kan skriva till subscription_statistics"
  ON subscription_statistics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- Alla autentiserade användare kan läsa statistik
CREATE POLICY "Autentiserade användare kan läsa subscription_statistics"
  ON subscription_statistics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Skapa en vy för prenumerationsöversikt
CREATE OR REPLACE VIEW subscription_overview AS
SELECT
  s.id,
  s.organization_id,
  o.name AS organization_name,
  sp.name AS plan_name,
  sp.display_name AS plan_display_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.stripe_subscription_id,
  s.created_at,
  s.updated_at,
  CASE 
    WHEN s.cancel_at_period_end THEN 'Avslutas vid periodens slut'
    WHEN s.status = 'active' THEN 'Aktiv'
    WHEN s.status = 'past_due' THEN 'Förfallen'
    WHEN s.status = 'canceled' THEN 'Avslutad'
    ELSE s.status
  END AS status_display,
  CASE
    WHEN sp.billing_interval = 'month' THEN sp.price
    WHEN sp.billing_interval = 'year' THEN sp.price / 12
    ELSE 0
  END AS monthly_cost,
  sp.currency
FROM
  subscriptions s
JOIN
  organizations o ON s.organization_id = o.id
JOIN
  subscription_plans sp ON s.plan_id = sp.id;

-- Sätt RLS för vyn
ALTER VIEW subscription_overview ENABLE ROW LEVEL SECURITY;

-- Skapa RLS-policy för vyn
CREATE POLICY "Användare kan se sin organisations prenumerationsöversikt"
  ON subscription_overview
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = subscription_overview.organization_id
      AND om.user_id = auth.uid()
    )
  ); 