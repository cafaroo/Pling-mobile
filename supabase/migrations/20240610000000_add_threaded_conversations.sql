-- Lägg till parent_id för trådade konversationer
ALTER TABLE team_messages
ADD COLUMN parent_id UUID REFERENCES team_messages(id),
ADD COLUMN reply_count INT DEFAULT 0;

-- Skapa index för snabbare sökning av trådar
CREATE INDEX idx_team_messages_parent_id ON team_messages(parent_id);

-- Uppdatera RLS policies för att inkludera trådade meddelanden
ALTER POLICY "Team members can view messages" ON team_messages
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
  )
);

-- Funktion för att uppdatera reply_count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE team_messages
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE team_messages
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att hålla reply_count uppdaterad
CREATE TRIGGER update_reply_count_trigger
AFTER INSERT OR DELETE ON team_messages
FOR EACH ROW
EXECUTE FUNCTION update_reply_count();

-- Funktion för att hämta trådade meddelanden
CREATE OR REPLACE FUNCTION get_thread_messages(
  message_id_param UUID,
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  user_id UUID,
  content TEXT,
  attachments JSONB,
  message_type TEXT,
  created_at TIMESTAMPTZ,
  parent_id UUID,
  reply_count INT,
  user_name TEXT,
  user_avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.team_id,
    m.user_id,
    m.content,
    m.attachments,
    m.message_type,
    m.created_at,
    m.parent_id,
    m.reply_count,
    p.name as user_name,
    p.avatar_url as user_avatar_url
  FROM team_messages m
  JOIN profiles p ON p.id = m.user_id
  WHERE m.parent_id = message_id_param
  ORDER BY m.created_at ASC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$; 