-- Team Messages Schema
-- Strukturen för team-meddelanden, reaktioner, bilagor och omnämnanden

-- Huvudtabell för meddelanden
CREATE TABLE team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 4000),
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bilagor till meddelanden
CREATE TABLE team_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'file', 'link')),
  url TEXT NOT NULL CHECK (char_length(url) <= 2000),
  name TEXT,
  size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reaktioner på meddelanden
CREATE TABLE team_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 20),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, emoji, user_id)
);

-- Omnämnanden i meddelanden
CREATE TABLE team_message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  index INTEGER NOT NULL CHECK (index >= 0),
  length INTEGER NOT NULL CHECK (length > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lässtatus för meddelanden
CREATE TABLE team_message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Index för bättre prestanda
CREATE INDEX team_messages_team_id_idx ON team_messages(team_id);
CREATE INDEX team_messages_sender_id_idx ON team_messages(sender_id);
CREATE INDEX team_messages_created_at_idx ON team_messages(created_at);
CREATE INDEX team_message_attachments_message_id_idx ON team_message_attachments(message_id);
CREATE INDEX team_message_reactions_message_id_idx ON team_message_reactions(message_id);
CREATE INDEX team_message_reactions_user_id_idx ON team_message_reactions(user_id);
CREATE INDEX team_message_mentions_message_id_idx ON team_message_mentions(message_id);
CREATE INDEX team_message_mentions_user_id_idx ON team_message_mentions(user_id);
CREATE INDEX team_message_read_status_team_id_user_id_idx ON team_message_read_status(team_id, user_id);

-- Row Level Security
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_message_read_status ENABLE ROW LEVEL SECURITY;

-- Policy: Endast teammedlemmar kan se meddelanden
CREATE POLICY "Team members can view messages"
  ON team_messages
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Användare kan skapa sina egna meddelanden
CREATE POLICY "Users can create their own messages"
  ON team_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Användare kan uppdatera sina egna meddelanden
CREATE POLICY "Users can update their own messages"
  ON team_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Policy: Användare kan radera sina egna meddelanden
CREATE POLICY "Users can delete their own messages"
  ON team_messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Policy: Teamadministratörer kan radera alla meddelanden i sitt team
CREATE POLICY "Team admins can delete any message in their team"
  ON team_messages
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Användare kan se bilagor för meddelanden de har tillgång till
CREATE POLICY "Users can view attachments for accessible messages"
  ON team_message_attachments
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM team_messages
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Användare kan lägga till bilagor till sina egna meddelanden
CREATE POLICY "Users can add attachments to their own messages"
  ON team_message_attachments
  FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM team_messages WHERE sender_id = auth.uid()
    )
  );

-- Policy: Användare kan se reaktioner på meddelanden de har tillgång till
CREATE POLICY "Users can view reactions for accessible messages"
  ON team_message_reactions
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM team_messages
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Användare kan lägga till sina egna reaktioner
CREATE POLICY "Users can add their own reactions"
  ON team_message_reactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM team_messages
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Användare kan ta bort sina egna reaktioner
CREATE POLICY "Users can delete their own reactions"
  ON team_message_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Användare kan se omnämnanden i meddelanden de har tillgång till
CREATE POLICY "Users can view mentions in accessible messages"
  ON team_message_mentions
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM team_messages
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Användare kan uppdatera sin egen lässtatus
CREATE POLICY "Users can update their own read status"
  ON team_message_read_status
  FOR ALL
  USING (user_id = auth.uid());

-- Realtidsprenumerationer på meddelanden
-- Gör det möjligt för klienter att prenumerera på nya meddelanden
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE team_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE team_message_mentions;

-- Trigger för att uppdatera updated_at automatiskt när ett meddelande uppdateras
CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_updated_at_trigger
BEFORE UPDATE ON team_messages
FOR EACH ROW EXECUTE PROCEDURE update_message_updated_at();

-- Trigger för att uppdatera updated_at automatiskt när lässtatus uppdateras
CREATE TRIGGER update_read_status_updated_at_trigger
BEFORE UPDATE ON team_message_read_status
FOR EACH ROW EXECUTE PROCEDURE update_message_updated_at();

-- Funktioner för att hantera meddelanden
-- Hämtar alla olästa meddelanden för en användare i ett team
CREATE OR REPLACE FUNCTION get_unread_message_count(team_id_param UUID, user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  last_read_time TIMESTAMPTZ;
  unread_count INTEGER;
BEGIN
  -- Hämta senaste lästimestamp för användaren
  SELECT last_read_at INTO last_read_time
  FROM team_message_read_status
  WHERE team_id = team_id_param AND user_id = user_id_param;
  
  -- Om ingen post finns, användaren har aldrig läst några meddelanden
  IF last_read_time IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM team_messages
    WHERE team_id = team_id_param AND is_deleted = FALSE;
    
    RETURN unread_count;
  END IF;
  
  -- Hämta antal meddelanden efter senaste lästa tidpunkten
  SELECT COUNT(*) INTO unread_count
  FROM team_messages
  WHERE team_id = team_id_param 
    AND created_at > last_read_time
    AND sender_id != user_id_param
    AND is_deleted = FALSE;
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql; 