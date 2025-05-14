/*
  # Add goals system
  
  1. New Tables
    - `goals`
      - Stores individual and team goals
      - Tracks progress and status
      - Supports different goal types and periods
    
    - `goal_milestones`
      - Stores milestones for goals
      - Tracks completion status
      - Allows for rewards at specific milestones
    
    - `goal_entries`
      - Records progress entries for goals
      - Links to sales or other sources
      - Tracks entry history
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user and team access
    - Ensure proper permission checks
*/

-- Create goal tables
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('sales_amount', 'sales_count')),
    target_value numeric NOT NULL,
    current_value numeric NOT NULL DEFAULT 0,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    period text NOT NULL CHECK (period IN ('week', 'month', 'quarter', 'year', 'custom')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'archived')),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    target_value numeric NOT NULL,
    reward text,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.goal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    value numeric NOT NULL,
    source_type text NOT NULL,
    source_id uuid,
    recorded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_entries ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for goals
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for goals
CREATE POLICY "Users can view own goals"
ON goals
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create own goals"
ON goals
FOR INSERT
TO authenticated
WITH CHECK (
    (user_id = auth.uid()) OR
    (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('leader', 'owner')
    ))
);

CREATE POLICY "Users can update own goals"
ON goals
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() OR
    (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('leader', 'owner')
    ))
)
WITH CHECK (
    user_id = auth.uid() OR
    (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('leader', 'owner')
    ))
);

CREATE POLICY "Users can delete own goals"
ON goals
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() OR
    (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('leader', 'owner')
    ))
);

-- Create RLS policies for goal milestones
CREATE POLICY "Users can view goal milestones"
ON goal_milestones
FOR SELECT
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE user_id = auth.uid() OR
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage goal milestones"
ON goal_milestones
FOR ALL
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE user_id = auth.uid() OR
        (team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('leader', 'owner')
        ))
    )
)
WITH CHECK (
    goal_id IN (
        SELECT id FROM goals
        WHERE user_id = auth.uid() OR
        (team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('leader', 'owner')
        ))
    )
);

-- Create RLS policies for goal entries
CREATE POLICY "Users can view goal entries"
ON goal_entries
FOR SELECT
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE user_id = auth.uid() OR
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can add goal entries"
ON goal_entries
FOR INSERT
TO authenticated
WITH CHECK (
    goal_id IN (
        SELECT id FROM goals
        WHERE user_id = auth.uid() OR
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    )
);

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current value of the goal
    UPDATE goals
    SET current_value = (
        SELECT COALESCE(SUM(value), 0)
        FROM goal_entries
        WHERE goal_id = NEW.goal_id
    )
    WHERE id = NEW.goal_id;
    
    -- Check if goal is completed
    UPDATE goals
    SET status = 'completed'
    WHERE id = NEW.goal_id
    AND current_value >= target_value
    AND status = 'active';
    
    -- Update milestone completion
    UPDATE goal_milestones
    SET 
        is_completed = true,
        completed_at = now()
    WHERE goal_id = NEW.goal_id
    AND is_completed = false
    AND target_value <= (
        SELECT current_value
        FROM goals
        WHERE id = NEW.goal_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for goal progress updates
CREATE TRIGGER on_goal_entry_added
    AFTER INSERT ON goal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Function to automatically record sales as goal entries
CREATE OR REPLACE FUNCTION process_sale_goal_entry()
RETURNS TRIGGER AS $$
DECLARE
    goal_record record;
BEGIN
    -- Find relevant active goals for individual
    FOR goal_record IN
        SELECT g.* 
        FROM goals g
        WHERE g.user_id = NEW.user_id
        AND g.status = 'active'
        AND g.start_date <= NEW.created_at
        AND g.end_date >= NEW.created_at
        AND g.type = 'sales_amount'
    LOOP
        -- Record entry for individual goal
        INSERT INTO goal_entries (
            goal_id,
            value,
            source_type,
            source_id
        ) VALUES (
            goal_record.id,
            NEW.amount,
            'sale',
            NEW.id
        );
    END LOOP;
    
    -- Find relevant active goals for team
    IF NEW.team_id IS NOT NULL THEN
        FOR goal_record IN
            SELECT g.* 
            FROM goals g
            WHERE g.team_id = NEW.team_id
            AND g.status = 'active'
            AND g.start_date <= NEW.created_at
            AND g.end_date >= NEW.created_at
            AND g.type = 'sales_amount'
        LOOP
            -- Record entry for team goal
            INSERT INTO goal_entries (
                goal_id,
                value,
                source_type,
                source_id
            ) VALUES (
                goal_record.id,
                NEW.amount,
                'sale',
                NEW.id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic goal entries from sales
CREATE TRIGGER on_sale_goal_entry
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION process_sale_goal_entry();

-- Function to check and update goal status
CREATE OR REPLACE FUNCTION check_goal_status()
RETURNS void AS $$
BEGIN
    -- Mark active goals as failed if end date has passed and target not reached
    UPDATE goals
    SET status = 'failed'
    WHERE status = 'active'
    AND end_date < now()
    AND current_value < target_value;
    
    -- Mark active goals as completed if target reached
    UPDATE goals
    SET status = 'completed'
    WHERE status = 'active'
    AND current_value >= target_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user goals
CREATE OR REPLACE FUNCTION get_user_goals(
    p_user_id uuid,
    p_status text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    type text,
    target_value numeric,
    current_value numeric,
    start_date timestamptz,
    end_date timestamptz,
    period text,
    status text,
    created_at timestamptz,
    updated_at timestamptz,
    progress numeric,
    days_remaining integer,
    milestones_count bigint,
    completed_milestones bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.description,
        g.type,
        g.target_value,
        g.current_value,
        g.start_date,
        g.end_date,
        g.period,
        g.status,
        g.created_at,
        g.updated_at,
        CASE 
            WHEN g.target_value = 0 THEN 0
            ELSE ROUND((g.current_value / g.target_value * 100), 2)
        END as progress,
        CASE
            WHEN g.end_date < now() THEN 0
            ELSE EXTRACT(DAY FROM (g.end_date - now()))::integer
        END as days_remaining,
        COUNT(gm.id) as milestones_count,
        SUM(CASE WHEN gm.is_completed THEN 1 ELSE 0 END) as completed_milestones
    FROM goals g
    LEFT JOIN goal_milestones gm ON gm.goal_id = g.id
    WHERE g.user_id = p_user_id
    AND (p_status IS NULL OR g.status = p_status)
    GROUP BY g.id
    ORDER BY 
        CASE g.status
            WHEN 'active' THEN 1
            WHEN 'completed' THEN 2
            WHEN 'failed' THEN 3
            WHEN 'archived' THEN 4
        END,
        g.end_date ASC;
END;
$$;

-- Create function to get team goals
CREATE OR REPLACE FUNCTION get_team_goals(
    p_team_id uuid,
    p_status text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    type text,
    target_value numeric,
    current_value numeric,
    start_date timestamptz,
    end_date timestamptz,
    period text,
    status text,
    created_at timestamptz,
    updated_at timestamptz,
    created_by_name text,
    progress numeric,
    days_remaining integer,
    milestones_count bigint,
    completed_milestones bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.description,
        g.type,
        g.target_value,
        g.current_value,
        g.start_date,
        g.end_date,
        g.period,
        g.status,
        g.created_at,
        g.updated_at,
        p.name as created_by_name,
        CASE 
            WHEN g.target_value = 0 THEN 0
            ELSE ROUND((g.current_value / g.target_value * 100), 2)
        END as progress,
        CASE
            WHEN g.end_date < now() THEN 0
            ELSE EXTRACT(DAY FROM (g.end_date - now()))::integer
        END as days_remaining,
        COUNT(gm.id) as milestones_count,
        SUM(CASE WHEN gm.is_completed THEN 1 ELSE 0 END) as completed_milestones
    FROM goals g
    LEFT JOIN goal_milestones gm ON gm.goal_id = g.id
    LEFT JOIN profiles p ON p.id = g.created_by
    WHERE g.team_id = p_team_id
    AND (p_status IS NULL OR g.status = p_status)
    GROUP BY g.id, p.name
    ORDER BY 
        CASE g.status
            WHEN 'active' THEN 1
            WHEN 'completed' THEN 2
            WHEN 'failed' THEN 3
            WHEN 'archived' THEN 4
        END,
        g.end_date ASC;
END;
$$;