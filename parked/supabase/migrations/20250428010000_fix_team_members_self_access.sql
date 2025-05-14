/*
  # Åtgärda rekursionsproblem i team_members för självåtkomst
  
  1. Ändringar
    - Lägg till en policy som uttryckligen tillåter användare att läsa sina egna medlemskap
    - Undviker rekursion genom att direkt jämföra user_id med auth.uid()
    - Ingen EXISTS-sats som anropar team_members-tabellen igen
    
  2. Säkerhet
    - Behåller befintlig säkerhetsmodell
    - Förhindrar oändlig rekursion
    - Möjliggör att användare kan se sina egna medlemskap
*/

-- Droppa den befintliga policyn om den existerar
DROP POLICY IF EXISTS "Users can read their own memberships" ON team_members;

-- Skapa en ny policy som uttryckligen tillåter användare att läsa sina egna medlemskap
CREATE POLICY "Users can read their own memberships"
ON team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Detta undviker rekursion eftersom vi inte använder EXISTS eller anropar team_members-tabellen igen i policyvillkoret 