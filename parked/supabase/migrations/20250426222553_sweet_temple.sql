/*
  # Add team member goals functionality
  
  1. Changes
    - Add assignee_id and assignee_type columns to goals table
    - Update RLS policies to allow team leaders to manage member goals
    - Add function to get team member goals
    
  2. Security
    - Maintain existing RLS protection
    - Allow team leaders to set goals for team members
    - Allow team members to view goals assigned to them
*/

-- Add new columns to goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assignee_type text CHECK (assignee_type IN ('team', 'individual'));

-- Update the existing check constraint to allow for team member goals
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_check
  CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL AND assignee_id IS NOT NULL AND assignee_type = 'individual')
  );

-- Create function to get team member goals
CREATE OR REPLACE FUNCTION get_team_member_goals(
    p_team_id uuid,
    p_assignee_id uuid,
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
    team_id uuid,
    assignee_id uuid,
    assignee_type text,
    created_at timestamptz,
    updated_at timestamptz,
    created_by_name text,
    assignee_name text,
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
        g.team_id,
        g.assignee_id,
        g.assignee_type,
        g.created_at,
        g.updated_at,
        creator.name as created_by_name,
        assignee.name as assignee_name,
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
    LEFT JOIN profiles creator ON creator.id = g.created_by
    LEFT JOIN profiles assignee ON assignee.id = g.assignee_id
    WHERE g.team_id = p_team_id
    AND g.assignee_id = p_assignee_id
    AND g.assignee_type = 'individual'
    AND (p_status IS NULL OR g.status = p_status)
    GROUP BY g.id, creator.name, assignee.name
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

-- Update RLS policies to allow team leaders to manage member goals
CREATE POLICY "Team leaders can manage member goals"
ON goals
FOR ALL
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'owner')
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'owner')
    )
);

-- Allow team members to view goals assigned to them
CREATE POLICY "Team members can view goals assigned to them"
ON goals
FOR SELECT
TO authenticated
USING (
    assignee_id = auth.uid()
);