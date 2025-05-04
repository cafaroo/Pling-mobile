/*
  # Komplett lösning för rekursionsproblem i team_members
  
  Denna migration implementerar en mer radikal lösning på rekursionsproblemet:
  1. Skapar en ny vy utan RLS för att säkert kunna referera till team_members-data
  2. Ersätter problematiska RLS-policyer med nya som använder hjälpfunktioner istället för direkta references
  3. Lägger till en API-funktion som helt kringgår RLS för teammedlemskap
  4. Ger rekommendationer för klientändringar
*/

-- 1. Temporärt inaktivera RLS för att säkert kunna utföra ändringarna
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- 2. Skapa en säker vy för direktåtkomst till team_members utan RLS
DROP VIEW IF EXISTS team_members_direct CASCADE;
CREATE VIEW team_members_direct AS
SELECT * FROM team_members;

-- Säkerställ att endast postgres kan använda denna vy
ALTER VIEW team_members_direct OWNER TO postgres;
REVOKE ALL ON team_members_direct FROM PUBLIC;
GRANT SELECT ON team_members_direct TO postgres;

-- 3. Droppa alla befintliga RLS-policyer på team_members
DROP POLICY IF EXISTS "Team admins can manage members direct" ON team_members;
DROP POLICY IF EXISTS "Team members can see other members in same team direct" ON team_members;
DROP POLICY IF EXISTS "Users can add themselves to teams direct" ON team_members;
DROP POLICY IF EXISTS "Users can read their own memberships direct" ON team_members;

-- 4. Skapa ny hjälpfunktion för att kontrollera team-admin utan att orsaka rekursion
CREATE OR REPLACE FUNCTION check_team_admin(team_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members_direct tm 
    WHERE tm.team_id = team_id_param
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
    AND tm.status = 'active'
  );
$$;

-- 5. Skapa ny hjälpfunktion för att kontrollera team-medlemskap utan att orsaka rekursion
CREATE OR REPLACE FUNCTION check_team_membership(team_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members_direct tm 
    WHERE tm.team_id = team_id_param
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  );
$$;

-- 6. Skapa API-funktion som ger direkt åtkomst till team-medlemskap utan RLS
CREATE OR REPLACE FUNCTION get_user_team_memberships(user_id_param uuid, status_param text DEFAULT 'active')
RETURNS TABLE (
  team_id uuid,
  user_id uuid,
  role team_member_role,
  status team_member_status
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.status
  FROM team_members_direct tm
  WHERE tm.user_id = user_id_param
  AND (status_param IS NULL OR tm.status = status_param::team_member_status);
$$;

-- 7. Skapa ny förenklad funktion för det exakta användarfallet i buggen
CREATE OR REPLACE FUNCTION get_user_team_ids(user_id_param uuid, status_param text DEFAULT 'active')
RETURNS TABLE (team_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.team_id
  FROM team_members_direct tm
  WHERE tm.user_id = user_id_param
  AND (status_param IS NULL OR tm.status = status_param::team_member_status);
$$;

-- 8. Aktivera RLS igen på team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 9. Skapa nya säkrare RLS-policyer med förbättrad design
-- Policy 1: Användare kan läsa sina egna medlemskap
CREATE POLICY "Users can read own memberships"
ON team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Team-medlemmar kan se andra medlemmar i samma team
CREATE POLICY "Team members can see other members"
ON team_members
FOR SELECT
TO authenticated
USING (check_team_membership(team_id));

-- Policy 3: Team-admins kan hantera medlemmar
CREATE POLICY "Team admins can manage members"
ON team_members
FOR ALL 
TO authenticated
USING (check_team_admin(team_id));

-- Policy 4: Användare kan lägga till sig själva i team
CREATE POLICY "Users can add themselves to teams"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 10. Exponera API-funktionerna för REST-åtkomst
GRANT EXECUTE ON FUNCTION get_user_team_memberships(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_team_ids(uuid, text) TO authenticated;

-- 11. Säkerställ att användarna av funktionerna inte kan ändra på funktionerna
REVOKE ALL ON FUNCTION check_team_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_team_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_team_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_team_membership(uuid) TO authenticated;

-- 12. Uppdatera has_team_role-funktionen för att använda direktåtkomst
CREATE OR REPLACE FUNCTION has_team_role(team_id uuid, required_roles team_member_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_members_direct tm
    WHERE tm.team_id = $1 
    AND tm.user_id = auth.uid()
    AND tm.role = ANY($2)
    AND tm.status = 'active'
  );
END;
$$;

/*
KLIENTKODSÄNDRING SOM KRÄVS:

I stället för:
supabase
  .from('team_members')
  .select('team_id')
  .eq('user_id', userId)
  .eq('status', 'active')

Använd:
supabase
  .rpc('get_user_team_ids', { 
    user_id_param: userId, 
    status_param: 'active' 
  })
*/ 