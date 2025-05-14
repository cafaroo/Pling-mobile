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
DROP TRIGGER IF EXISTS refresh_team_statistics_trigger ON team_activities;
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

-- Skapa funktion för att hämta trenddata för flera team
CREATE OR REPLACE FUNCTION get_teams_activity_trend(
  p_team_ids UUID[],
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS TABLE (
  team_id UUID,
  date DATE,
  activity_count BIGINT,
  active_members BIGINT,
  activity_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    team_id,
    date::DATE,
    activity_count,
    active_members,
    activity_breakdown
  FROM team_daily_statistics
  WHERE team_id = ANY(p_team_ids)
    AND date BETWEEN p_start_date AND p_end_date
  ORDER BY team_id, date;
END;
$$ LANGUAGE plpgsql;

-- Skapa en materialized view för månadsstatistik
CREATE MATERIALIZED VIEW IF NOT EXISTS team_monthly_statistics AS
SELECT 
  team_id,
  DATE_TRUNC('month', date) as month,
  SUM(activity_count) as activity_count,
  MAX(active_members) as max_active_members,
  COUNT(DISTINCT date) as active_days,
  (
    SELECT jsonb_object_agg(
      key, 
      value
    )
    FROM (
      SELECT 
        key, 
        SUM(value::int) as value 
      FROM 
        team_daily_statistics, 
        jsonb_each_text(activity_breakdown) 
      WHERE 
        team_id = tds.team_id AND 
        DATE_TRUNC('month', date) = DATE_TRUNC('month', tds.date)
      GROUP BY key
    ) as agg
  ) as activity_breakdown
FROM team_daily_statistics tds
GROUP BY team_id, DATE_TRUNC('month', date);

-- Skapa index på materialized view för månadsstatistik
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_monthly_stats_team_month
ON team_monthly_statistics(team_id, month);

-- Funktion för att uppdatera månadsstatistik
CREATE OR REPLACE FUNCTION refresh_team_monthly_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Uppdatera bara om månadsstatistik är äldre än 1 dag
  IF (SELECT MAX(date) FROM team_daily_statistics) > 
     (SELECT COALESCE(MAX(month), '2000-01-01'::timestamp) + INTERVAL '1 day' FROM team_monthly_statistics) THEN
    REFRESH MATERIALIZED VIEW team_monthly_statistics;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att uppdatera månadsstatistik vid ändring av daglig statistik
DROP TRIGGER IF EXISTS refresh_monthly_stats_trigger ON team_daily_statistics;
CREATE TRIGGER refresh_monthly_stats_trigger
AFTER INSERT OR UPDATE ON team_daily_statistics
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_team_monthly_statistics();

-- Kör initial uppdatering av materialized views
REFRESH MATERIALIZED VIEW team_daily_statistics;
REFRESH MATERIALIZED VIEW team_monthly_statistics; 