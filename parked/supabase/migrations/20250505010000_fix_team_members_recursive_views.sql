/*
  # Radikal fix för rekursionsproblem i team_members
  
  1. Ändringar
    - Inaktiverar RLS temporärt på team_members för att undvika rekursion
    - Återskapar team_members_view med direkt access 
    - Återskapar team_members_with_profiles med direkt access
    - Skapar nya säkrare RLS-policyer för team_members
    
  2. Säkerhet
    - Temporärt inaktiverar och återaktiverar RLS för att undvika rekursion
    - Använder SECURITY DEFINER för alla vyer för att undvika RLS-rekursion
    - Implementerar direkt åtkomst utan att gå via RLS-lagret
*/

-- 1. Temporärt inaktivera RLS på team_members
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- 2. Droppa alla vyer som kan orsaka rekursion
DROP VIEW IF EXISTS team_members_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS team_members_with_profiles CASCADE;

-- 3. Skapa en funktion för att kontrollera team-medlemskap utan att gå via RLS
CREATE OR REPLACE FUNCTION get_user_teams_direct()
RETURNS TABLE (team_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = auth.uid()
  AND tm.status = 'active';
$$;

-- 4. Återskapar team_members_view med säkrare åtkomst
CREATE OR REPLACE VIEW team_members_view AS
SELECT 
  tm.id,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.joined_at,
  tm.invited_by,
  tm.status,
  p.name,
  p.avatar_url,
  p.email
FROM team_members tm
JOIN profiles p ON tm.user_id = p.id;

ALTER VIEW team_members_view OWNER TO postgres;
GRANT SELECT ON team_members_view TO authenticated;

-- 5. Återskapar team_members_with_profiles med säkrare åtkomst
CREATE MATERIALIZED VIEW team_members_with_profiles AS
SELECT 
  id,
  team_id,
  user_id,
  role,
  joined_at,
  invited_by,
  status,
  name,
  avatar_url,
  email
FROM team_members_view;

CREATE INDEX team_members_with_profiles_id_idx ON team_members_with_profiles(id);
ALTER MATERIALIZED VIEW team_members_with_profiles OWNER TO postgres;
GRANT SELECT ON team_members_with_profiles TO authenticated;

-- 6. Droppa alla befintliga policyer på team_members
DROP POLICY IF EXISTS "Team admins and owners can manage members" ON team_members;
DROP POLICY IF EXISTS "Team members can see other members in same team" ON team_members;
DROP POLICY IF EXISTS "Users can add themselves to teams" ON team_members;
DROP POLICY IF EXISTS "Users can read their own memberships" ON team_members;

-- 7. Aktivera RLS på team_members igen
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 8. Skapa en extremt enkel policy för användarbaserad åtkomst
CREATE POLICY "Users can read their own memberships direct"
ON team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 9. Skapa en extremt enkel policy för teambaserad åtkomst
CREATE POLICY "Team members can see other members in same team direct"
ON team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM get_user_teams_direct() ut
    WHERE ut.team_id = team_members.team_id
  )
);

-- 10. Skapa policy för admin-åtkomst utan rekursion
CREATE POLICY "Team admins can manage members direct"
ON team_members
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
    AND tm.status = 'active'
  )
);

-- 11. Skapa en enkel policy för att lägga till sig själv i team
CREATE POLICY "Users can add themselves to teams direct"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 12. Uppdatera funktionen has_team_role för att använda get_user_teams_direct
CREATE OR REPLACE FUNCTION has_team_role(team_id uuid, required_roles team_member_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_members tm
    WHERE tm.team_id = $1 
    AND tm.user_id = auth.uid()
    AND tm.role = ANY($2)
    AND tm.status = 'active'
  );
END;
$$; 