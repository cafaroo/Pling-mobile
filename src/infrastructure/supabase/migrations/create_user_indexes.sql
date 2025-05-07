-- Migration för att lägga till index för användarrelaterade tabeller
-- Skapad: 2024-05-01
-- Beskrivning: Lägger till index för att optimera frågor mot användartabeller

-- Index för användar-ID i user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

-- Index för användar-ID i user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);

-- Index för e-post i users-tabellen
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index för status i users-tabellen
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- GIN-index för team_ids-arrayen (möjliggör effektiva sökningar på teamnivå)
CREATE INDEX IF NOT EXISTS idx_users_team_ids ON users USING GIN (team_ids);

-- GIN-index för role_ids-arrayen (möjliggör effektiva sökningar på rollnivå)
CREATE INDEX IF NOT EXISTS idx_users_role_ids ON users USING GIN (role_ids);

-- Index för användartyp och status (för filtreringsoptimering)
CREATE INDEX IF NOT EXISTS idx_users_status_role_ids ON users (status, role_ids);

-- Analyser tabeller för att uppdatera statistik för optimering
ANALYZE users;
ANALYZE user_profiles;
ANALYZE user_settings; 