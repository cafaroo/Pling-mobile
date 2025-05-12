-- Indexeringar för resursbegränsningssystemet
-- Skapade för att optimera prestanda vid läsning och skrivning av resursanvändningsdata

-- Index på resource_limits för snabbare lookup av begränsningar per plan
CREATE INDEX IF NOT EXISTS idx_resource_limits_plan_type 
ON resource_limits (plan_type);

CREATE INDEX IF NOT EXISTS idx_resource_limits_resource_type 
ON resource_limits (resource_type);

-- Sammansatt index för snabbare koppling mellan plan och resurstyp
CREATE INDEX IF NOT EXISTS idx_resource_limits_plan_resource_type 
ON resource_limits (plan_type, resource_type);

-- Index på resource_usage för snabbare lookup av användning per organisation
CREATE INDEX IF NOT EXISTS idx_resource_usage_organization_id 
ON resource_usage (organization_id);

CREATE INDEX IF NOT EXISTS idx_resource_usage_resource_type 
ON resource_usage (resource_type);

-- Primär sammansatt index för snabbare resurskontroller
-- Detta är redan en primärnyckel via UNIQUE constraint, men om constraint inte existerar:
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_usage_org_id_resource_type 
ON resource_usage (organization_id, resource_type);

-- Index på resource_usage_history för snabbare tidsbaserade sökningar
CREATE INDEX IF NOT EXISTS idx_resource_usage_history_organization_id 
ON resource_usage_history (organization_id);

CREATE INDEX IF NOT EXISTS idx_resource_usage_history_resource_type 
ON resource_usage_history (resource_type);

CREATE INDEX IF NOT EXISTS idx_resource_usage_history_recorded_at 
ON resource_usage_history (recorded_at);

-- Sammansatt index för tidsserieanalys av en viss resursanvändning
CREATE INDEX IF NOT EXISTS idx_resource_usage_history_org_resource_time 
ON resource_usage_history (organization_id, resource_type, recorded_at);

-- Index på notifications för snabbare användarnotifikation
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications (is_read);

-- Index för att snabbt hitta olästa notifikationer för en användare
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications (user_id, is_read);

-- Index för notifikationstyper
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications (type);

-- Index för att snabbt hitta resursbegränsningsnotifikationer
CREATE INDEX IF NOT EXISTS idx_notifications_type_is_read 
ON notifications (type, is_read) 
WHERE type IN ('resource_limit_exceeded', 'resource_limit_approaching');

-- Index på device_tokens för snabbare tokens per användare
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id 
ON device_tokens (user_id);

-- Index för senast använda token per enhet
CREATE INDEX IF NOT EXISTS idx_device_tokens_last_used 
ON device_tokens (last_used);

-- Analysera tabeller för att optimera planering av frågor
ANALYZE resource_limits;
ANALYZE resource_usage;
ANALYZE resource_usage_history;
ANALYZE notifications;
ANALYZE device_tokens; 