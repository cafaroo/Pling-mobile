/*
  # Fix för problemet med att admin inte kan se teammedlemmars namn
  
  1. Ändringar
    - Skapar en ny säker RPC-funktion för att hämta teammedlemmar med profilinformation
    - Använder SECURITY DEFINER för att kringgå RLS begränsningar
    - Exponerar funktionen för authenticated användare
  
  2. Säkerhet
    - Använder team_members_direct för att undvika RLS-rekursion
    - Kontrollerar behörighet manuellt genom att verifiera att anroparen är medlem i teamet
*/

-- Skapa en säker funktion för att hämta teammedlemmar med profiler direkt
CREATE OR REPLACE FUNCTION get_team_members_with_profiles(team_id_param uuid)
RETURNS TABLE (
  id uuid,
  team_id uuid,
  user_id uuid,
  role team_member_role,
  status team_member_status,
  created_at timestamptz,
  updated_at timestamptz,
  name text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kontrollera att användaren har åtkomst till teamet
  IF NOT EXISTS (
    SELECT 1
    FROM team_members_direct
    WHERE team_id = team_id_param
    AND user_id = auth.uid()
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Du har inte behörighet att visa detta teams medlemmar';
  END IF;

  -- Hämta medlemmarna med profilinformation
  RETURN QUERY
  SELECT
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.status,
    tm.created_at,
    tm.updated_at,
    p.name,
    p.email,
    p.avatar_url
  FROM
    team_members_direct tm
  LEFT JOIN
    profiles p ON tm.user_id = p.id
  WHERE
    tm.team_id = team_id_param;
END;
$$;

-- Ge åtkomst till funktionen för autentiserade användare
GRANT EXECUTE ON FUNCTION get_team_members_with_profiles(uuid) TO authenticated;

-- Fall back om team_members_direct inte finns (kan tas bort i produktion men bra för testning)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname = 'team_members_direct'
  ) THEN
    CREATE VIEW team_members_direct AS SELECT * FROM team_members;
    ALTER VIEW team_members_direct OWNER TO postgres;
    REVOKE ALL ON team_members_direct FROM PUBLIC;
    GRANT SELECT ON team_members_direct TO postgres;
  END IF;
END
$$; 