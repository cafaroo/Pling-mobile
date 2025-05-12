-- Migration: notifications_table
-- Tabeller för att hantera notifikationer om resursbegränsningar

-- Enum för notifikationstyper
CREATE TYPE notification_type AS ENUM (
  'resource_limit_warning',  -- Nära resursgräns
  'resource_limit_reached',  -- Resursgräns nådd
  'subscription_updated',    -- Prenumeration uppdaterad
  'subscription_expiring',   -- Prenumeration på väg att gå ut
  'system_message'           -- Systemmeddelande
);

-- Notifikationstabell
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Tabell för att spåra redan skickade resursbegränsningsnotifikationer
-- Används för att undvika att spamma användare med samma notifikation
CREATE TABLE resource_limit_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  notification_type notification_type NOT NULL,
  last_sent TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipients JSONB NOT NULL, -- Lista med användare som fått notifikationen
  UNIQUE(organization_id, resource_type, notification_type)
);

-- Skapa index för prestanda
CREATE INDEX notification_user_idx ON notifications(user_id);
CREATE INDEX notification_read_idx ON notifications(user_id, is_read);
CREATE INDEX notification_created_idx ON notifications(created_at);
CREATE INDEX resource_limit_notification_org_idx ON resource_limit_notifications(organization_id);

-- RLS-policyer för notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Användare kan bara se sina egna notifikationer
CREATE POLICY "Användare kan bara se sina egna notifikationer"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Användare kan bara uppdatera sina egna notifikationer (markera som lästa)
CREATE POLICY "Användare kan bara uppdatera sina egna notifikationer"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Systemrollen kan skapa och hantera alla notifikationer
CREATE POLICY "Systemrollen kan hantera alla notifikationer"
  ON notifications
  FOR ALL
  TO service_role
  USING (true);

-- RLS-policyer för resource_limit_notifications
ALTER TABLE resource_limit_notifications ENABLE ROW LEVEL SECURITY;

-- Administratörer kan se notifikationer för sina organisationer
CREATE POLICY "Administratörer kan se resursgränsnotifikationer"
  ON resource_limit_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = resource_limit_notifications.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Systemrollen kan skapa och hantera alla resursgränsnotifikationer
CREATE POLICY "Systemrollen kan hantera alla resursgränsnotifikationer"
  ON resource_limit_notifications
  FOR ALL
  TO service_role
  USING (true);

-- Funktion för att skicka en resursgränsnotifikation till administratörer i en organisation
CREATE OR REPLACE FUNCTION send_resource_limit_notification(
  org_id UUID,
  res_type resource_type,
  notif_type notification_type,
  notif_title TEXT,
  notif_body TEXT,
  notif_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user record;
  notification_id UUID;
  existing_notification_record UUID;
BEGIN
  -- Kontrollera om vi redan skickat denna notifikation nyligen (inom 24 timmar)
  SELECT id INTO existing_notification_record
  FROM resource_limit_notifications
  WHERE organization_id = org_id
    AND resource_type = res_type
    AND notification_type = notif_type
    AND last_sent > (NOW() - INTERVAL '24 hours');
    
  -- Om vi redan har en nylig notifikation, uppdatera bara tidpunkten
  IF existing_notification_record IS NOT NULL THEN
    UPDATE resource_limit_notifications
    SET last_sent = NOW()
    WHERE id = existing_notification_record;
    RETURN;
  END IF;
  
  -- Skapa en ny notifieringsspårning
  INSERT INTO resource_limit_notifications (
    organization_id, 
    resource_type, 
    notification_type, 
    recipients
  )
  VALUES (
    org_id, 
    res_type, 
    notif_type, 
    '[]'::jsonb
  )
  ON CONFLICT (organization_id, resource_type, notification_type)
  DO UPDATE SET 
    last_sent = NOW(),
    recipients = '[]'::jsonb
  RETURNING id INTO notification_id;
  
  -- Skicka notifikation till alla administratörer
  FOR admin_user IN (
    SELECT om.user_id
    FROM organization_members om
    WHERE om.organization_id = org_id
    AND om.role IN ('owner', 'admin')
  ) LOOP
    -- Skapa notifikation för användaren
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      metadata
    )
    VALUES (
      admin_user.user_id,
      notif_title,
      notif_body,
      notif_type,
      notif_metadata
    );
    
    -- Uppdatera listan med användare som fått notifikationen
    UPDATE resource_limit_notifications
    SET recipients = recipients || jsonb_build_array(admin_user.user_id)
    WHERE id = notification_id;
  END LOOP;
END;
$$; 