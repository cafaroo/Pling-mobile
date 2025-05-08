-- Skapa materialized view för daglig aktivitetsstatistik
CREATE MATERIALIZED VIEW IF NOT EXISTS team_daily_statistics AS
SELECT 
  team_id,
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) as activity_count,
  COUNT(DISTINCT performed_by) as active_members,
  jsonb_object_agg(activity_type, COUNT(*)) as activity_breakdown
FROM team_activities
GROUP BY team_id, DATE_TRUNC('day', timestamp);

-- Skapa index på materialized view för snabb åtkomst
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_daily_stats_team_date 
ON team_daily_statistics(team_id, date);

-- Skapa funktion för att uppdatera materialized view
CREATE OR REPLACE FUNCTION refresh_team_daily_statistics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY team_daily_statistics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Skapa trigger för att automatiskt uppdatera statistik
CREATE TRIGGER refresh_team_statistics_trigger
AFTER INSERT OR UPDATE OR DELETE ON team_activities
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_team_daily_statistics();

-- Skapa sammansatt index för effektiv filtrering och sortering
CREATE INDEX IF NOT EXISTS idx_team_activities_team_date_type
ON team_activities(team_id, timestamp, activity_type);

-- Skapa funktion för att hämta teamstatistik för en period
CREATE OR REPLACE FUNCTION get_team_statistics(
  p_team_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS TABLE (
  date DATE,
  activity_count BIGINT,
  active_members BIGINT,
  activity_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date::DATE,
    activity_count,
    active_members,
    activity_breakdown
  FROM team_daily_statistics
  WHERE team_id = p_team_id
    AND date BETWEEN p_start_date AND p_end_date
  ORDER BY date;
END;
$$ LANGUAGE plpgsql; 