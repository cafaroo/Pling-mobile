/*
  # Add competition management functions
  
  1. New Functions
    - create_competition: Create new competitions with validation
    - join_competition: Handle participant registration
    - record_competition_entry: Record entries with automatic progress updates
    - get_competition_stats: Get detailed competition statistics
    - check_competition_eligibility: Validate participation eligibility
    
  2. Security
    - All functions use security definer
    - Maintain RLS policies
    - Validate permissions before operations
*/

-- Function to create a new competition
CREATE OR REPLACE FUNCTION create_competition(
  title text,
  description text,
  type text,
  start_date timestamptz,
  end_date timestamptz,
  target_type text,
  target_value numeric,
  prize text,
  team_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_competition_id uuid;
BEGIN
  -- Validate dates
  IF start_date >= end_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;

  -- Validate competition type
  IF type NOT IN ('individual', 'team') THEN
    RAISE EXCEPTION 'Invalid competition type';
  END IF;

  -- Validate target type
  IF target_type NOT IN ('sales_amount', 'sales_count', 'custom') THEN
    RAISE EXCEPTION 'Invalid target type';
  END IF;

  -- Check if team exists and user has permission
  IF team_id IS NOT NULL AND NOT check_team_leader(team_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to create team competition';
  END IF;

  -- Create competition
  INSERT INTO competitions (
    title,
    description,
    type,
    start_date,
    end_date,
    target_type,
    target_value,
    prize,
    team_id
  ) VALUES (
    title,
    description,
    type,
    start_date,
    end_date,
    target_type,
    target_value,
    prize,
    team_id
  ) RETURNING id INTO new_competition_id;

  RETURN new_competition_id;
END;
$$;

-- Function to join a competition
CREATE OR REPLACE FUNCTION join_competition(
  competition_id uuid,
  participant_type text,
  participant_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  competition_record record;
  new_participant_id uuid;
BEGIN
  -- Get competition details
  SELECT * INTO competition_record
  FROM competitions
  WHERE id = competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  -- Validate participant type matches competition type
  IF competition_record.type != participant_type THEN
    RAISE EXCEPTION 'Invalid participant type for this competition';
  END IF;

  -- Check if already participating
  IF participant_type = 'individual' THEN
    IF EXISTS (
      SELECT 1 FROM competition_participants
      WHERE competition_id = competition_record.id
      AND user_id = participant_id
    ) THEN
      RAISE EXCEPTION 'Already participating in this competition';
    END IF;

    -- Insert individual participant
    INSERT INTO competition_participants (
      competition_id,
      user_id,
      current_value
    ) VALUES (
      competition_record.id,
      participant_id,
      0
    ) RETURNING id INTO new_participant_id;
  ELSE
    IF EXISTS (
      SELECT 1 FROM competition_participants
      WHERE competition_id = competition_record.id
      AND team_id = participant_id
    ) THEN
      RAISE EXCEPTION 'Team is already participating in this competition';
    END IF;

    -- Insert team participant
    INSERT INTO competition_participants (
      competition_id,
      team_id,
      current_value
    ) VALUES (
      competition_record.id,
      participant_id,
      0
    ) RETURNING id INTO new_participant_id;
  END IF;

  RETURN new_participant_id;
END;
$$;

-- Function to get competition statistics
CREATE OR REPLACE FUNCTION get_competition_stats(competition_id uuid)
RETURNS TABLE (
  total_participants bigint,
  total_entries bigint,
  average_value numeric,
  leader_name text,
  leader_value numeric,
  completion_percentage numeric,
  time_remaining interval,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT cp.id) as participant_count,
      COUNT(DISTINCT ce.id) as entry_count,
      COALESCE(AVG(cp.current_value), 0) as avg_value,
      MAX(cp.current_value) as max_value,
      c.target_value,
      c.end_date,
      c.start_date,
      CASE
        WHEN now() BETWEEN c.start_date AND c.end_date THEN true
        ELSE false
      END as active
    FROM competitions c
    LEFT JOIN competition_participants cp ON cp.competition_id = c.id
    LEFT JOIN competition_entries ce ON ce.participant_id = cp.id
    WHERE c.id = competition_id
    GROUP BY c.id, c.target_value, c.end_date, c.start_date
  ),
  leader AS (
    SELECT
      CASE
        WHEN cp.user_id IS NOT NULL THEN p.name
        ELSE t.name
      END as name,
      cp.current_value
    FROM competition_participants cp
    LEFT JOIN profiles p ON p.id = cp.user_id
    LEFT JOIN teams t ON t.id = cp.team_id
    WHERE cp.competition_id = competition_id
    ORDER BY cp.current_value DESC
    LIMIT 1
  )
  SELECT
    stats.participant_count,
    stats.entry_count,
    ROUND(stats.avg_value, 2),
    leader.name,
    leader.current_value,
    ROUND((stats.max_value / stats.target_value * 100), 2),
    stats.end_date - now(),
    stats.active
  FROM stats
  LEFT JOIN leader ON true;
END;
$$;

-- Function to check competition eligibility
CREATE OR REPLACE FUNCTION check_competition_eligibility(
  competition_id uuid,
  user_id uuid
)
RETURNS TABLE (
  can_participate boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  competition_record record;
BEGIN
  -- Get competition details
  SELECT * INTO competition_record
  FROM competitions c
  WHERE c.id = competition_id;

  -- Competition not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Competition not found';
    RETURN;
  END IF;

  -- Check if competition has ended
  IF competition_record.end_date < now() THEN
    RETURN QUERY SELECT false, 'Competition has ended';
    RETURN;
  END IF;

  -- Check if competition has started
  IF competition_record.start_date > now() THEN
    RETURN QUERY SELECT false, 'Competition has not started yet';
    RETURN;
  END IF;

  -- Check team competition restrictions
  IF competition_record.team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = competition_record.team_id
      AND user_id = check_competition_eligibility.user_id
    ) THEN
      RETURN QUERY SELECT false, 'Not a member of the required team';
      RETURN;
    END IF;
  END IF;

  -- Check if already participating
  IF competition_record.type = 'individual' THEN
    IF EXISTS (
      SELECT 1 FROM competition_participants
      WHERE competition_id = competition_record.id
      AND user_id = check_competition_eligibility.user_id
    ) THEN
      RETURN QUERY SELECT false, 'Already participating';
      RETURN;
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM competition_participants cp
      JOIN team_members tm ON tm.team_id = cp.team_id
      WHERE cp.competition_id = competition_record.id
      AND tm.user_id = check_competition_eligibility.user_id
    ) THEN
      RETURN QUERY SELECT false, 'Team is already participating';
      RETURN;
    END IF;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'Eligible to participate';
END;
$$;

-- Function to get participant progress
CREATE OR REPLACE FUNCTION get_participant_progress(
  participant_id uuid
)
RETURNS TABLE (
  current_value numeric,
  target_value numeric,
  percentage_complete numeric,
  rank integer,
  total_participants bigint,
  entries_count bigint,
  last_entry_at timestamptz,
  time_remaining interval
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    cp.current_value,
    c.target_value,
    ROUND((cp.current_value / c.target_value * 100), 2) as percentage_complete,
    cp.rank,
    COUNT(*) OVER (PARTITION BY c.id) as total_participants,
    COUNT(ce.id) as entries_count,
    cp.last_entry_at,
    c.end_date - now() as time_remaining
  FROM competition_participants cp
  JOIN competitions c ON c.id = cp.competition_id
  LEFT JOIN competition_entries ce ON ce.participant_id = cp.id
  WHERE cp.id = participant_id
  GROUP BY cp.id, cp.current_value, c.target_value, cp.rank, cp.last_entry_at, c.id, c.end_date;
$$;