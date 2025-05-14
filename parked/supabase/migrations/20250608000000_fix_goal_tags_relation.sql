-- Fix för relationsproblem mellan goal_tags och goal_tag_relations
-- Tilläggsmigration efter 20250605000000_update_goals_schema.sql

-- Fixa främmandenyckel-relationen som saknas
ALTER TABLE IF EXISTS goal_tag_relations 
ADD COLUMN IF NOT EXISTS tag_id uuid REFERENCES goal_tags(id) ON DELETE CASCADE;

-- Om tag_id redan finns men behöver uppdateras
COMMENT ON COLUMN goal_tag_relations.tag_id IS 'ID för taggen, kopplar till goal_tags-tabellen';

-- Skapa goal_contributors-tabellen som saknades
CREATE TABLE IF NOT EXISTS goal_contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contribution_count integer NOT NULL DEFAULT 1,
  first_contribution_at timestamptz NOT NULL DEFAULT now(),
  last_contribution_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

-- Aktivera RLS för den nya tabellen
ALTER TABLE IF EXISTS goal_contributors ENABLE ROW LEVEL SECURITY;

-- Skapa policies för goal_contributors
CREATE POLICY "Användare kan se alla contributors"
ON goal_contributors
FOR SELECT
TO authenticated
USING (true);

-- Skapa funktion för att uppdatera goal_contributors baserat på goal_progress_logs
CREATE OR REPLACE FUNCTION update_goal_contributors()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO goal_contributors (goal_id, user_id)
  VALUES (NEW.goal_id, NEW.changed_by)
  ON CONFLICT (goal_id, user_id) DO UPDATE
  SET 
    contribution_count = goal_contributors.contribution_count + 1,
    last_contribution_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger som uppdaterar goal_contributors när någon lägger till goal_progress
CREATE TRIGGER update_contributors_on_progress
  AFTER INSERT ON goal_progress_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_contributors();

-- Populera goal_contributors med existerande data från goal_progress_logs om det finns någon
INSERT INTO goal_contributors (goal_id, user_id, contribution_count, first_contribution_at, last_contribution_at)
SELECT 
  goal_id,
  changed_by,
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM goal_progress_logs
GROUP BY goal_id, changed_by
ON CONFLICT (goal_id, user_id) DO NOTHING; 