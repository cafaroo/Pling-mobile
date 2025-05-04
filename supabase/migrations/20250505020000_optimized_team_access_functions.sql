/*
  # Optimerade funktioner för team-åtkomst
  
  1. Ändringar
    - Skapa en direkt API-funktion för getUserTeams
    - Förbättra prestanda för vanliga anrop
    
  2. Säkerhet
    - Använder SECURITY DEFINER för direkt åtkomst utan RLS
    - Undviker rekursion helt och hållet
*/

-- 0. Droppa befintliga funktioner om de existerar
DROP FUNCTION IF EXISTS get_user_team_ids(uuid);
DROP FUNCTION IF EXISTS get_user_teams(uuid);
DROP FUNCTION IF EXISTS api_get_team_members(uuid, text);

-- 1. Skapa en optimerad funktion direkt för getUserTeams-anropet
CREATE OR REPLACE FUNCTION get_user_team_ids(user_id_param uuid)
RETURNS TABLE (team_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = user_id_param
  AND tm.status = 'active';
$$;

-- 2. Skapa en funktion för att hämta team med detaljer
CREATE OR REPLACE FUNCTION get_user_teams(user_id_param uuid)
RETURNS TABLE (
  team_id uuid,
  name text,
  description text,
  created_at timestamptz,
  profile_image text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    t.id AS team_id,
    t.name,
    t.description,
    t.created_at,
    t.profile_image
  FROM teams t
  JOIN team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = user_id_param
  AND tm.status = 'active';
$$;

-- 3. Skapa en REST-anropsbar API för att hämta team-medlemmar
CREATE OR REPLACE FUNCTION api_get_team_members(user_id_param uuid, status_param text DEFAULT 'active')
RETURNS TABLE (team_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = user_id_param
  AND (status_param IS NULL OR tm.status = status_param::team_member_status);
$$;

-- 4. Exponera API-funktionen för REST-åtkomst
GRANT EXECUTE ON FUNCTION api_get_team_members(uuid, text) TO authenticated; 