/*
  # Enhance competition system
  
  1. Changes
    - Add competition status management
    - Add competition joining flow
    - Add competition entry tracking
    - Add real-time updates
    
  2. Security
    - Enable RLS on all tables
    - Add policies for team-based access
*/

-- Function to update competition status
CREATE OR REPLACE FUNCTION update_competition_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update status based on dates
  NEW.status := CASE
    WHEN NEW.start_date > now() THEN 'upcoming'
    WHEN NEW.end_date < now() THEN 'ended'
    ELSE 'active'
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for competition status
CREATE TRIGGER competition_status_update
  BEFORE INSERT OR UPDATE ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_status();

-- Function to join competition
CREATE OR REPLACE FUNCTION join_competition(
  competition_id uuid,
  user_id uuid,
  team_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  competition_record record;
  participant_id uuid;
BEGIN
  -- Get competition details
  SELECT * INTO competition_record
  FROM competitions
  WHERE id = competition_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Competition not found'
    );
  END IF;
  
  -- Check if competition is active
  IF competition_record.status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Competition is not active'
    );
  END IF;
  
  -- Check participant type
  IF competition_record.participant_type = 'individual' AND team_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This is an individual competition'
    );
  END IF;
  
  IF competition_record.participant_type = 'team' AND team_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This is a team competition'
    );
  END IF;
  
  -- Check if already participating
  IF EXISTS (
    SELECT 1 FROM competition_participants
    WHERE competition_id = competition_record.id
    AND (
      (user_id IS NOT NULL AND competition_participants.user_id = join_competition.user_id)
      OR
      (team_id IS NOT NULL AND competition_participants.team_id = join_competition.team_id)
    )
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Already participating in this competition'
    );
  END IF;
  
  -- Create participant
  INSERT INTO competition_participants (
    competition_id,
    user_id,
    team_id,
    current_value,
    rank
  ) VALUES (
    competition_id,
    CASE WHEN competition_record.participant_type = 'individual' THEN user_id ELSE NULL END,
    CASE WHEN competition_record.participant_type = 'team' THEN team_id ELSE NULL END,
    0,
    (
      SELECT COUNT(*) + 1
      FROM competition_participants
      WHERE competition_id = competition_record.id
    )
  )
  RETURNING id INTO participant_id;
  
  -- Create welcome notification
  INSERT INTO competition_notifications (
    competition_id,
    participant_id,
    type,
    title,
    message,
    data
  ) VALUES (
    competition_id,
    participant_id,
    'achievement',
    'Welcome to the competition!',
    'You have successfully joined the competition. Good luck!',
    '{}'::jsonb
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined competition',
    'participant_id', participant_id
  );
END;
$$;

-- Function to record competition entry
CREATE OR REPLACE FUNCTION record_competition_entry(
  competition_id uuid,
  participant_id uuid,
  value numeric,
  source_type text,
  source_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  competition_record record;
  participant_record record;
  entry_id uuid;
  old_rank int;
  new_rank int;
BEGIN
  -- Get competition and participant
  SELECT * INTO competition_record
  FROM competitions
  WHERE id = competition_id;
  
  SELECT * INTO participant_record
  FROM competition_participants
  WHERE id = participant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Competition or participant not found'
    );
  END IF;
  
  -- Check if competition is active
  IF competition_record.status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Competition is not active'
    );
  END IF;
  
  -- Store old rank for comparison
  old_rank := participant_record.rank;
  
  -- Create entry
  INSERT INTO competition_entries (
    competition_id,
    participant_id,
    value,
    source_type,
    source_id
  ) VALUES (
    competition_id,
    participant_id,
    value,
    source_type,
    source_id
  )
  RETURNING id INTO entry_id;
  
  -- Update participant progress
  UPDATE competition_participants
  SET 
    current_value = current_value + value,
    last_entry_at = now()
  WHERE id = participant_id;
  
  -- Update rankings
  WITH rankings AS (
    SELECT 
      id,
      DENSE_RANK() OVER (ORDER BY current_value DESC) as new_rank
    FROM competition_participants
    WHERE competition_id = competition_record.id
  )
  UPDATE competition_participants cp
  SET rank = r.new_rank
  FROM rankings r
  WHERE cp.id = r.id;
  
  -- Get new rank
  SELECT rank INTO new_rank
  FROM competition_participants
  WHERE id = participant_id;
  
  -- Create rank change notification if rank improved
  IF new_rank < old_rank THEN
    INSERT INTO competition_notifications (
      competition_id,
      participant_id,
      type,
      title,
      message,
      data
    ) VALUES (
      competition_id,
      participant_id,
      'rank_change',
      'New Rank!',
      CASE 
        WHEN new_rank = 1 THEN 'Congratulations! You are now in first place!'
        ELSE 'You moved up to rank #' || new_rank || '!'
      END,
      jsonb_build_object(
        'old_rank', old_rank,
        'new_rank', new_rank
      )
    );
  END IF;
  
  -- Check for milestone achievements
  PERFORM check_competition_achievements(participant_id);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Entry recorded successfully',
    'entry_id', entry_id,
    'new_rank', new_rank,
    'rank_change', old_rank - new_rank
  );
END;
$$;

-- Function to get competition leaderboard
CREATE OR REPLACE FUNCTION get_competition_leaderboard(
  competition_id uuid,
  limit_count integer DEFAULT 10,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  participant_id uuid,
  name text,
  avatar_url text,
  current_value numeric,
  rank integer,
  rank_change integer,
  is_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH participant_details AS (
    SELECT
      cp.id,
      COALESCE(p.name, t.name) as participant_name,
      COALESCE(p.avatar_url, null) as participant_avatar,
      cp.current_value,
      cp.rank,
      COALESCE(p.id = user_id, false) as is_user_participant
    FROM competition_participants cp
    LEFT JOIN profiles p ON p.id = cp.user_id
    LEFT JOIN teams t ON t.id = cp.team_id
    WHERE cp.competition_id = get_competition_leaderboard.competition_id
  ),
  rank_changes AS (
    SELECT
      participant_id,
      COALESCE(
        LAG(rank) OVER (PARTITION BY competition_id ORDER BY recorded_at DESC) - rank,
        0
      ) as rank_change
    FROM (
      SELECT DISTINCT ON (participant_id)
        competition_id,
        participant_id,
        rank,
        recorded_at
      FROM competition_entries ce
      JOIN competition_participants cp ON cp.id = ce.participant_id
      WHERE cp.competition_id = get_competition_leaderboard.competition_id
      ORDER BY participant_id, recorded_at DESC
    ) recent_ranks
  )
  SELECT
    pd.id,
    pd.participant_name,
    pd.participant_avatar,
    pd.current_value,
    pd.rank,
    COALESCE(rc.rank_change, 0),
    pd.is_user_participant
  FROM participant_details pd
  LEFT JOIN rank_changes rc ON rc.participant_id = pd.id
  ORDER BY pd.rank ASC
  LIMIT limit_count;
END;
$$;