-- Prenumerationsåtkomst
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisationer kan se sina egna prenumerationer"
  ON subscriptions
  FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Endast administratörer kan ändra prenumerationer"
  ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND org_id = organization_id
      AND role = 'admin'
    )
  );

-- Prenumerationshistorik åtkomst
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administratörer kan se prenumerationshistorik"
  ON subscription_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN organization_members om ON s.organization_id = om.org_id
      WHERE s.id = subscription_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Användningsspårningsåtkomst
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administratörer kan se användningsspårning"
  ON subscription_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN organization_members om ON s.organization_id = om.org_id
      WHERE s.id = subscription_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Prenumerationsplaner är synliga för alla autentiserade användare
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alla autentiserade användare kan se prenumerationsplaner"
  ON subscription_plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Endast systemadministratörer (service role) kan ändra planer
CREATE POLICY "Endast systemadministratörer kan ändra planer"
  ON subscription_plans
  FOR ALL
  USING (auth.role() = 'service_role'); 