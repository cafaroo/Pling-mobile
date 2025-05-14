/*
  # Add competitions system
  
  1. New Tables
    - `competitions`
      - Competition details and rules
      - Start/end dates
      - Prize information
      - Target metrics
    
    - `competition_participants`
      - Track participants (users/teams)
      - Current progress
      - Rankings
    
    - `competition_entries`
      - Individual entries/achievements
      - Automatic entry from sales records
  
  2. Security
    - Enable RLS on all tables
    - Team-based access control
    - Automatic entry processing
*/

-- Create competitions table
CREATE TABLE IF NOT EXISTS public.competitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('individual', 'team')),
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    target_type text NOT NULL CHECK (type IN ('sales_amount', 'sales_count', 'custom')),
    target_value numeric NOT NULL,
    prize text,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- team_id NULL means global competition
    CHECK (end_date > start_date)
);

-- Create competition participants table
CREATE TABLE IF NOT EXISTS public.competition_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    current_value numeric DEFAULT 0,
    last_entry_at timestamptz,
    rank integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Either user_id OR team_id must be set, not both
    CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- Create competition entries table
CREATE TABLE IF NOT EXISTS public.competition_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    participant_id uuid REFERENCES competition_participants(id) ON DELETE CASCADE NOT NULL,
    value numeric NOT NULL,
    source_type text NOT NULL,
    source_id uuid,
    recorded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON public.competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_participants_updated_at
    BEFORE UPDATE ON public.competition_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Users can view available competitions"
ON competitions
FOR SELECT
TO authenticated
USING (
    team_id IS NULL OR  -- Global competitions
    team_id IN (       -- Team competitions
        SELECT tm.team_id 
        FROM team_members tm 
        WHERE tm.user_id = auth.uid()
    )
);

CREATE POLICY "Team leaders can manage competitions"
ON competitions
FOR ALL
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id 
        FROM team_members tm 
        WHERE tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id 
        FROM team_members tm 
        WHERE tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
);

CREATE POLICY "Users can view competition participants"
ON competition_participants
FOR SELECT
TO authenticated
USING (
    competition_id IN (
        SELECT c.id 
        FROM competitions c
        WHERE c.team_id IS NULL OR
        c.team_id IN (
            SELECT tm.team_id 
            FROM team_members tm 
            WHERE tm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "System can manage competition entries"
ON competition_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to get competition leaderboard
CREATE OR REPLACE FUNCTION get_competition_leaderboard(competition_id uuid)
RETURNS TABLE (
    rank bigint,
    participant_name text,
    current_value numeric,
    percentage_complete numeric,
    last_entry_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    WITH rankings AS (
        SELECT 
            cp.id,
            DENSE_RANK() OVER (ORDER BY cp.current_value DESC) as rank,
            CASE
                WHEN cp.user_id IS NOT NULL THEN p.name
                WHEN cp.team_id IS NOT NULL THEN t.name
            END as name,
            cp.current_value,
            c.target_value,
            cp.last_entry_at
        FROM competition_participants cp
        JOIN competitions c ON c.id = cp.competition_id
        LEFT JOIN profiles p ON p.id = cp.user_id
        LEFT JOIN teams t ON t.id = cp.team_id
        WHERE cp.competition_id = get_competition_leaderboard.competition_id
    )
    SELECT 
        rank,
        name as participant_name,
        current_value,
        ROUND((current_value / target_value * 100)::numeric, 2) as percentage_complete,
        last_entry_at
    FROM rankings
    ORDER BY rank ASC;
$$;

-- Function to automatically record competition entry from sale
CREATE OR REPLACE FUNCTION process_sale_competition_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    competition_record record;
    participant_id uuid;
BEGIN
    -- Find relevant active competitions
    FOR competition_record IN
        SELECT c.* 
        FROM competitions c
        WHERE c.start_date <= NEW.created_at
        AND c.end_date >= NEW.created_at
        AND c.target_type = 'sales_amount'
        AND (
            c.team_id IS NULL OR  -- Global competition
            c.team_id = NEW.team_id  -- Team competition
        )
    LOOP
        -- Get or create participant
        IF competition_record.type = 'individual' THEN
            -- Individual participant
            INSERT INTO competition_participants (
                competition_id, user_id, current_value
            )
            VALUES (
                competition_record.id, NEW.user_id, 0
            )
            ON CONFLICT (competition_id, user_id) DO NOTHING
            RETURNING id INTO participant_id;
            
            IF participant_id IS NULL THEN
                SELECT id INTO participant_id
                FROM competition_participants
                WHERE competition_id = competition_record.id
                AND user_id = NEW.user_id;
            END IF;
        ELSE
            -- Team participant
            INSERT INTO competition_participants (
                competition_id, team_id, current_value
            )
            VALUES (
                competition_record.id, NEW.team_id, 0
            )
            ON CONFLICT (competition_id, team_id) DO NOTHING
            RETURNING id INTO participant_id;
            
            IF participant_id IS NULL THEN
                SELECT id INTO participant_id
                FROM competition_participants
                WHERE competition_id = competition_record.id
                AND team_id = NEW.team_id;
            END IF;
        END IF;
        
        -- Record entry
        INSERT INTO competition_entries (
            competition_id,
            participant_id,
            value,
            source_type,
            source_id
        ) VALUES (
            competition_record.id,
            participant_id,
            NEW.amount,
            'sale',
            NEW.id
        );
        
        -- Update participant progress
        UPDATE competition_participants
        SET 
            current_value = current_value + NEW.amount,
            last_entry_at = NEW.created_at,
            updated_at = now()
        WHERE id = participant_id;
        
        -- Update rankings
        UPDATE competition_participants
        SET rank = rankings.rank
        FROM (
            SELECT 
                id,
                DENSE_RANK() OVER (ORDER BY current_value DESC) as rank
            FROM competition_participants
            WHERE competition_id = competition_record.id
        ) rankings
        WHERE competition_participants.id = rankings.id
        AND competition_participants.competition_id = competition_record.id;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic competition entries
CREATE TRIGGER on_sale_created
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION process_sale_competition_entry();