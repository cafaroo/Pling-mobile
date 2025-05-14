-- Skapa index för vanliga sökningar
CREATE INDEX IF NOT EXISTS idx_team_activities_complex
ON team_activities(team_id, performed_by, activity_type, timestamp);

-- Skapa partitionsfunktion för prestanda med stora datamängder
CREATE OR REPLACE FUNCTION get_paginated_team_activities(
  p_team_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_activity_types TEXT[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL,
  p_user_is_target BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  performed_by UUID,
  performer_name TEXT,
  activity_type TEXT,
  target_id UUID,
  target_name TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  _total_count BIGINT;
BEGIN
  -- Beräkna total antal först för pagination
  SELECT COUNT(*)
  INTO _total_count
  FROM team_activities ta
  LEFT JOIN profiles p ON ta.performed_by = p.id
  LEFT JOIN profiles tp ON ta.target_id = tp.id
  WHERE ta.team_id = p_team_id
    AND (p_activity_types IS NULL OR ta.activity_type = ANY(p_activity_types))
    AND (p_user_id IS NULL OR ta.performed_by = p_user_id)
    AND (p_start_date IS NULL OR ta.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR ta.timestamp <= p_end_date)
    AND (p_user_is_target = FALSE OR ta.target_id = p_user_id);

  RETURN QUERY
  SELECT
    ta.id,
    ta.team_id,
    ta.performed_by,
    p.name AS performer_name,
    ta.activity_type,
    ta.target_id,
    tp.name AS target_name,
    ta.metadata,
    ta.timestamp,
    _total_count
  FROM team_activities ta
  LEFT JOIN profiles p ON ta.performed_by = p.id
  LEFT JOIN profiles tp ON ta.target_id = tp.id
  WHERE ta.team_id = p_team_id
    AND (p_activity_types IS NULL OR ta.activity_type = ANY(p_activity_types))
    AND (p_user_id IS NULL OR ta.performed_by = p_user_id)
    AND (p_start_date IS NULL OR ta.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR ta.timestamp <= p_end_date)
    AND (p_user_is_target = FALSE OR ta.target_id = p_user_id)
  ORDER BY ta.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Skapa RPC för aktivitetsstatistik per typ
CREATE OR REPLACE FUNCTION get_team_activity_stats(
  p_team_id UUID,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  activity_type TEXT,
  activity_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    activity_type,
    COUNT(*) AS activity_count
  FROM team_activities
  WHERE team_id = p_team_id
    AND (p_start_date IS NULL OR timestamp >= p_start_date)
    AND (p_end_date IS NULL OR timestamp <= p_end_date)
  GROUP BY activity_type
  ORDER BY activity_count DESC;
END;
$$;

-- Optimera och lägga till index för RLS
CREATE INDEX IF NOT EXISTS idx_team_activities_team_timestamp_type
ON team_activities(team_id, timestamp DESC, activity_type);

-- Skapa funktion för att hämta de senaste aktiviteterna
CREATE OR REPLACE FUNCTION get_latest_team_activities(
  p_team_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  performed_by UUID,
  performer_name TEXT,
  activity_type TEXT,
  target_id UUID,
  target_name TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ta.id,
    ta.team_id,
    ta.performed_by,
    p.name AS performer_name,
    ta.activity_type,
    ta.target_id,
    tp.name AS target_name,
    ta.metadata,
    ta.timestamp
  FROM team_activities ta
  LEFT JOIN profiles p ON ta.performed_by = p.id
  LEFT JOIN profiles tp ON ta.target_id = tp.id
  WHERE ta.team_id = p_team_id
  ORDER BY ta.timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Skapa funktion för att hämta aktiviteter för en användare över alla team
CREATE OR REPLACE FUNCTION get_user_activities_across_teams(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  team_name TEXT,
  performed_by UUID,
  performer_name TEXT,
  activity_type TEXT,
  target_id UUID,
  target_name TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  _total_count BIGINT;
BEGIN
  -- Beräkna total antal först
  SELECT COUNT(*)
  INTO _total_count
  FROM team_activities ta
  JOIN team_members tm ON ta.team_id = tm.team_id
  WHERE tm.user_id = p_user_id
    AND tm.status = 'active'
    AND (ta.performed_by = p_user_id OR ta.target_id = p_user_id);

  RETURN QUERY
  SELECT
    ta.id,
    ta.team_id,
    t.name AS team_name,
    ta.performed_by,
    p.name AS performer_name,
    ta.activity_type,
    ta.target_id,
    tp.name AS target_name,
    ta.metadata,
    ta.timestamp,
    _total_count
  FROM team_activities ta
  JOIN teams t ON ta.team_id = t.id
  JOIN team_members tm ON ta.team_id = tm.team_id
  LEFT JOIN profiles p ON ta.performed_by = p.id
  LEFT JOIN profiles tp ON ta.target_id = tp.id
  WHERE tm.user_id = p_user_id
    AND tm.status = 'active'
    AND (ta.performed_by = p_user_id OR ta.target_id = p_user_id)
  ORDER BY ta.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$; 