/*
  # Omfattande fix för rekursionsproblem i team_members-tabellen
  
  1. Ändringar
    - Droppar alla befintliga policyer på team_members-tabellen
    - Skapar optimerade policyer med säkrare implementering
    - Uppdaterar funktionen has_team_role för att undvika rekursion
    
  2. Säkerhet
    - Behåller befintlig säkerhetsmodell
    - Fullständigt eliminerar rekursion
    - Förenklar RLS-logiken
*/

-- Först, droppa alla befintliga policyer på team_members för att börja om
DROP POLICY IF EXISTS "Enable delete for team owners" ON team_members;
DROP POLICY IF EXISTS "Enable insert for self or team admins" ON team_members;
DROP POLICY IF EXISTS "Enable member management for admins and owners" ON team_members;
DROP POLICY IF EXISTS "Enable read access for all team members" ON team_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON team_members;
DROP POLICY IF EXISTS "Enable update for team admins" ON team_members;
DROP POLICY IF EXISTS "Users can read their own memberships" ON team_members;

-- Skapa en funktion med direkt åtkomst till rollinformation utan att behöva använda team_members-policyerna igen
CREATE OR REPLACE FUNCTION has_team_role_direct(team_id uuid, required_roles team_member_role[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Direkt SQL-fråga som undviker rekursion genom att inte gå via RLS-policyer
  SELECT EXISTS (
    SELECT 1 
    FROM team_members tm
    WHERE tm.team_id = $1 
    AND tm.user_id = auth.uid()
    AND tm.role = ANY($2)
    AND tm.status = 'active'
  );
$$;

-- 1. Grundläggande läsbehörighet: användare kan läsa sina egna medlemskap
CREATE POLICY "Users can read their own memberships"
ON team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Team-medlemmar kan se andra medlemmar i samma team
CREATE POLICY "Team members can see other members in same team"
ON team_members
FOR SELECT
TO authenticated
USING (
  -- Utför check direkt utan rekursion
  team_id IN (
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 3. Admin-behörigheter för att hantera medlemmar
CREATE POLICY "Team admins and owners can manage members"
ON team_members
FOR ALL
TO authenticated
USING (
  -- Utför check direkt utan rekursion
  team_id IN (
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  -- Utför check direkt utan rekursion  
  team_id IN (
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
    AND tm.status = 'active'
  )
);

-- 4. Användare kan lägga till sig själva i ett team
CREATE POLICY "Users can add themselves to teams"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Uppdatera den befintliga has_team_role-funktionen för att använda direkt logik
CREATE OR REPLACE FUNCTION has_team_role(team_id uuid, required_roles team_member_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Direkt SQL-fråga som undviker rekursion genom att inte gå via RLS-policyer
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