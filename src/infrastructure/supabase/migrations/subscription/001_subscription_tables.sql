-- Prenumerationsplaner
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktiva prenumerationer
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMP WITH TIME ZONE,
  payment_provider TEXT NOT NULL,
  payment_customer_id TEXT,
  payment_subscription_id TEXT,
  payment_method_id TEXT,
  billing_email TEXT NOT NULL,
  billing_name TEXT NOT NULL,
  billing_address JSONB NOT NULL,
  billing_vat_number TEXT,
  usage JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prenumerationshistorik
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Användningsspårning
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric TEXT NOT NULL,
  value INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiera grundläggande prenumerationsplaner
INSERT INTO subscription_plans 
  (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES
  (
    'basic',
    'Pling Basic',
    'Perfekt för små team och testanvändare',
    0,
    0,
    '[
      {"id": "basic_goal_management", "name": "Grundläggande målhantering", "description": "Hantera enkla mål", "enabled": true, "tier": "basic"},
      {"id": "basic_statistics", "name": "Begränsad statistik", "description": "Enkel statistik över måluppfyllnad", "enabled": true, "tier": "basic"},
      {"id": "basic_competitions", "name": "Grundläggande tävlingsfunktioner", "description": "Skapa enkla tävlingar", "enabled": true, "tier": "basic"}
    ]',
    '{"teamMembers": 3, "mediaStorage": 100, "customDashboards": 0}'
  ),
  (
    'pro',
    'Pling Pro',
    'För medelstora team och aktiva användare',
    299,
    2990,
    '[
      {"id": "basic_goal_management", "name": "Grundläggande målhantering", "description": "Hantera enkla mål", "enabled": true, "tier": "basic"},
      {"id": "advanced_goal_management", "name": "Avancerad målhantering", "description": "Målberoenden och avancerade inställningar", "enabled": true, "tier": "pro"},
      {"id": "basic_statistics", "name": "Begränsad statistik", "description": "Enkel statistik över måluppfyllnad", "enabled": true, "tier": "basic"},
      {"id": "full_statistics", "name": "Fullständig statistik", "description": "Detaljerade rapporter och insikter", "enabled": true, "tier": "pro"},
      {"id": "basic_competitions", "name": "Grundläggande tävlingsfunktioner", "description": "Skapa enkla tävlingar", "enabled": true, "tier": "basic"},
      {"id": "all_competitions", "name": "Alla tävlingsfunktioner", "description": "Anpassade tävlingar och belöningar", "enabled": true, "tier": "pro"},
      {"id": "priority_support", "name": "Prioriterad support", "description": "Snabbare svarstid på supportärenden", "enabled": true, "tier": "pro"},
      {"id": "custom_dashboards", "name": "Anpassade team-dashboards", "description": "Skapa och anpassa team-dashboards", "enabled": true, "tier": "pro"}
    ]',
    '{"teamMembers": 10, "mediaStorage": 1024, "customDashboards": 3}'
  ),
  (
    'enterprise',
    'Pling Enterprise',
    'För stora organisationer och företag',
    999,
    9990,
    '[
      {"id": "basic_goal_management", "name": "Grundläggande målhantering", "description": "Hantera enkla mål", "enabled": true, "tier": "basic"},
      {"id": "advanced_goal_management", "name": "Avancerad målhantering", "description": "Målberoenden och avancerade inställningar", "enabled": true, "tier": "pro"},
      {"id": "enterprise_goal_management", "name": "Enterprise-funktioner för målhantering", "description": "Organisationsövergripande mål och hierarkier", "enabled": true, "tier": "enterprise"},
      {"id": "basic_statistics", "name": "Begränsad statistik", "description": "Enkel statistik över måluppfyllnad", "enabled": true, "tier": "basic"},
      {"id": "full_statistics", "name": "Fullständig statistik", "description": "Detaljerade rapporter och insikter", "enabled": true, "tier": "pro"},
      {"id": "advanced_analytics", "name": "Avancerad analys", "description": "Prediktiv statistik och trendanalys", "enabled": true, "tier": "enterprise"},
      {"id": "basic_competitions", "name": "Grundläggande tävlingsfunktioner", "description": "Skapa enkla tävlingar", "enabled": true, "tier": "basic"},
      {"id": "all_competitions", "name": "Alla tävlingsfunktioner", "description": "Anpassade tävlingar och belöningar", "enabled": true, "tier": "pro"},
      {"id": "custom_competitions", "name": "Anpassade tävlingar och belöningar", "description": "Skapa helt anpassade tävlingar", "enabled": true, "tier": "enterprise"},
      {"id": "priority_support", "name": "Prioriterad support", "description": "Snabbare svarstid på supportärenden", "enabled": true, "tier": "pro"},
      {"id": "dedicated_support", "name": "Dedikerad support", "description": "Personlig kontaktperson", "enabled": true, "tier": "enterprise"},
      {"id": "custom_dashboards", "name": "Anpassade team-dashboards", "description": "Skapa och anpassa team-dashboards", "enabled": true, "tier": "pro"},
      {"id": "api_access", "name": "API-tillgång", "description": "Tillgång till Pling API", "enabled": true, "tier": "enterprise"},
      {"id": "sso_integration", "name": "SSO-integration", "description": "Enkel inloggning med företagets identitetssystem", "enabled": true, "tier": "enterprise"},
      {"id": "custom_security", "name": "Anpassade säkerhetsinställningar", "description": "Skräddarsydda säkerhetspolicyer", "enabled": true, "tier": "enterprise"}
    ]',
    '{"teamMembers": 25, "mediaStorage": 15360, "customDashboards": 10, "apiRequests": 10000, "concurrentUsers": 100}'
  ); 