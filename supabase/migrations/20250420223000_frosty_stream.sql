/*
  # Add team rankings function

  1. New Functions
    - `get_team_rankings`: Returns team rankings based on total sales
      - Returns a table with team_id, total sales, and rank
      - Rank is calculated using DENSE_RANK() to handle ties properly

  2. Security
    - Function is accessible to authenticated users only
    - Users can only see rankings if they are a team member
*/

CREATE OR REPLACE FUNCTION get_team_rankings()
RETURNS TABLE (
  team_id uuid,
  total numeric,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH team_totals AS (
    SELECT 
      t.id as team_id,
      COALESCE(SUM(s.amount), 0) as total
    FROM teams t
    LEFT JOIN sales s ON s.team_id = t.id
    GROUP BY t.id
  )
  SELECT 
    team_id,
    total,
    DENSE_RANK() OVER (ORDER BY total DESC) as rank
  FROM team_totals
  WHERE EXISTS (
    SELECT 1 
    FROM team_members tm 
    WHERE tm.team_id = team_totals.team_id 
    AND tm.user_id = auth.uid()
  );
$$;