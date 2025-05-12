-- Migration: device_tokens_table
-- Tabell för att spara enhetstoken för push-notifikationer

-- Tabell för att lagra push-notifikationstoken
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL, -- FCM-token eller motsvarande
  device_type TEXT NOT NULL, -- ios, android, web
  device_name TEXT,
  app_version TEXT,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index för förbättrad prestanda
CREATE INDEX device_tokens_user_idx ON device_tokens(user_id);
CREATE INDEX device_tokens_token_idx ON device_tokens(token);

-- RLS-policyer
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Användare kan se och hantera sina egna enhetstoken
CREATE POLICY "Användare kan hantera sina egna enhetstoken"
  ON device_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Systemrollen kan administrera alla enhetstoken
CREATE POLICY "Systemrollen kan administrera alla enhetstoken"
  ON device_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Ge nödvändiga rättigheter
GRANT SELECT, INSERT, UPDATE, DELETE ON device_tokens TO authenticated;
GRANT ALL ON device_tokens TO service_role;

-- Funktion för att uppdatera eller lägga till enhetstoken
CREATE OR REPLACE FUNCTION update_device_token(
  p_user_id UUID,
  p_token TEXT,
  p_device_type TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_app_version TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_id UUID;
BEGIN
  -- Försök uppdatera existerande token
  UPDATE device_tokens
  SET 
    last_used = NOW(),
    device_name = COALESCE(p_device_name, device_name),
    app_version = COALESCE(p_app_version, app_version)
  WHERE 
    user_id = p_user_id AND 
    token = p_token
  RETURNING id INTO token_id;
  
  -- Om token inte existerar, skapa ny
  IF token_id IS NULL THEN
    INSERT INTO device_tokens (
      user_id, 
      token, 
      device_type, 
      device_name, 
      app_version
    )
    VALUES (
      p_user_id, 
      p_token, 
      p_device_type, 
      p_device_name, 
      p_app_version
    )
    RETURNING id INTO token_id;
  END IF;
  
  -- Städa upp gamla tokens (äldre än 6 månader och inte använts på 3 månader)
  DELETE FROM device_tokens
  WHERE 
    user_id = p_user_id AND
    created_at < (NOW() - INTERVAL '6 months') AND
    last_used < (NOW() - INTERVAL '3 months');
    
  RETURN token_id;
END;
$$;

-- Funktion för att ta bort enhetstoken
CREATE OR REPLACE FUNCTION remove_device_token(
  p_user_id UUID,
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM device_tokens
  WHERE 
    user_id = p_user_id AND 
    token = p_token
  RETURNING 1 INTO rows_deleted;
  
  RETURN rows_deleted > 0;
END;
$$; 