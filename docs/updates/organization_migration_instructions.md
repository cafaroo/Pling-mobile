# Organisationsdomän: SQL-Migrationsinstruktioner

## Översikt

Detta dokument beskriver hur du kör SQL-migrationerna för organisationsdomänen i Pling-applikationen. Det finns två huvudsakliga migrationsfiler som behöver köras i korrekt ordning:

1. `organization_tables.sql` - Skapar grundläggande tabeller för organisationer och medlemskap
2. `organization_invitations.sql` - Lägger till stöd för inbjudningar till organisationer

## Migrationsfiler

### 1. organization_tables.sql

Denna migration skapar:
- Enum-typ för organisationsroller
- Organizations-tabell med grundläggande fält
- Organization_members-tabell för medlemskap
- Team_organizations-tabell för koppling mellan team och organisationer
- RLS-policyer för säker dataåtkomst
- Index för prestandaoptimering
- Triggers för automatisk uppdatering av tidsstämplar

### 2. organization_invitations.sql

Denna migration skapar:
- Enum-typ för inbjudningsstatus
- Organization_invitations-tabell för inbjudningar
- RLS-policyer för säker hantering av inbjudningar
- Index för prestandaoptimering
- Triggers och funktioner för automatisk hantering av utgångna inbjudningar

## Körordning

**Viktigt:** Migrationerna måste köras i följande ordning:
1. Först `organization_tables.sql`
2. Sedan `organization_invitations.sql`

Detta är viktigt eftersom den andra migrationen är beroende av tabeller och enum-typer som skapas i den första.

## Körinstruktioner

### Via Supabase Dashboard

1. Logga in på [Supabase Dashboard](https://app.supabase.io)
2. Välj ditt projekt
3. Gå till "SQL Editor"
4. Kopiera och kör innehållet från `organization_tables.sql`
5. Kontrollera att inga fel uppstår
6. Kopiera och kör innehållet från `organization_invitations.sql`
7. Kontrollera att inga fel uppstår

### Via Supabase MCP (om tillgängligt)

```bash
# Kör migrationen för organization_tables först
mcp_supabase_apply_migration --project_id="ditt_projekt_id" --name="organization_tables" --query="innehåll_från_organization_tables.sql"

# När första migrationen är klar, kör inbjudningsmigrationen
mcp_supabase_apply_migration --project_id="ditt_projekt_id" --name="organization_invitations" --query="innehåll_från_organization_invitations.sql"
```

## Innehåll för migrationerna

### organization_tables.sql

```sql
-- Skapa enum typ för organisationsroller
CREATE TYPE organization_role_enum AS ENUM ('owner', 'admin', 'member', 'invited');

-- Organisations-tabell
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Organisationsmedlemskap-tabell
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Koppling mellan team och organisationer
CREATE TABLE IF NOT EXISTS team_organizations (
  team_id UUID NOT NULL REFERENCES v2_teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, organization_id)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_team_organizations_org_id ON team_organizations(organization_id);

-- Säkerhetspolicyer för RLS (Row Level Security)

-- Standardpolicy: Endast ägare och medlemmar kan se organisationer
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by members" 
  ON organizations FOR SELECT 
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

-- Endast ägare kan uppdatera organisationen
CREATE POLICY "Organizations are updatable by owner" 
  ON organizations FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Endast ägare kan ta bort organisationen
CREATE POLICY "Organizations are deletable by owner" 
  ON organizations FOR DELETE 
  USING (auth.uid() = owner_id);

-- Alla autentiserade användare kan skapa organisationer
CREATE POLICY "Any authenticated user can create organizations" 
  ON organizations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Medlemskapsregler
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Medlemmar kan se andra medlemmar i organisationer de tillhör
CREATE POLICY "Members can see other members in their organizations" 
  ON organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- Endast ägare och admins kan hantera medlemmar
CREATE POLICY "Owners and admins can manage members" 
  ON organization_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Teamkopplingsregler
ALTER TABLE team_organizations ENABLE ROW LEVEL SECURITY;

-- Endast organisationsägare och admins kan hantera teamkopplingar
CREATE POLICY "Owners and admins can manage team connections" 
  ON team_organizations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Alla medlemmar kan se teamkopplingar
CREATE POLICY "Members can see team connections" 
  ON team_organizations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- Funktioner för real-time uppdateringar
CREATE OR REPLACE FUNCTION public.handle_organization_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for att uppdatera updated_at när en organisation ändras
CREATE TRIGGER organization_updated
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION handle_organization_update();
```

### organization_invitations.sql

```sql
-- Skapa enum typ för inbjudningsstatus
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Skapa inbjudningstabell för organisationer
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id, status)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_user_id ON organization_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);

-- Säkerhetspolicyer för RLS (Row Level Security)
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Alla kan se inbjudningar de har fått
CREATE POLICY "Users can see own invitations" 
  ON organization_invitations FOR SELECT 
  USING (
    auth.uid() = user_id
  );

-- Organisationsmedlemmar kan se inbjudningar till sin organisation
CREATE POLICY "Organization members can see sent invitations" 
  ON organization_invitations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
    )
  );

-- Endast organisationsägare och admins kan skapa inbjudningar
CREATE POLICY "Organization owners and admins can create invitations" 
  ON organization_invitations FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Endast organisationsägare, admins och den inbjudna användaren kan uppdatera inbjudningar
CREATE POLICY "Organization owners, admins and invited users can update invitations" 
  ON organization_invitations FOR UPDATE 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Endast organisationsägare och admins kan ta bort inbjudningar
CREATE POLICY "Organization owners and admins can delete invitations" 
  ON organization_invitations FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Funktion för att automatiskt markera utgångna inbjudningar
CREATE OR REPLACE FUNCTION handle_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Om vi försöker uppdatera en inbjudan men den har gått ut, markera den som utgången
  IF OLD.status = 'pending' AND NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att kontrollera utgångsdatum vid uppdatering
CREATE TRIGGER check_invitation_expiration
BEFORE UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION handle_expired_invitations();

-- Funktion för att markera utgångna inbjudningar vid läsning
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' AND OLD.status = 'pending' AND OLD.expires_at < NOW() THEN
    UPDATE organization_invitations
    SET status = 'expired'
    WHERE id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att räkna aktiva inbjudningar till en organisation
CREATE OR REPLACE FUNCTION get_pending_invitations_count(org_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM organization_invitations
  WHERE organization_id = org_id
  AND status = 'pending'
  AND expires_at > NOW();
$$;
```

## Verifiering efter körning

Efter att migrationerna har körts, kontrollera följande:

1. **Kontrollera att tabellerna har skapats korrekt:**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name LIKE 'organization%';
   ```

2. **Kontrollera att RLS-policyer har skapats:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename LIKE 'organization%';
   ```

3. **Kontrollera att index har skapats korrekt:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename LIKE 'organization%';
   ```

4. **Kontrollera att enum-typer har skapats:**
   ```sql
   SELECT * FROM pg_type WHERE typname IN ('organization_role_enum', 'invitation_status_enum');
   ```

Om något saknas eller om det finns fel, kontrollera felmeddelanden från Supabase och gör nödvändiga korrigeringar.

## Potentiella problem och lösningar

### Problem: Enum-typ finns redan

Om du får fel som "type 'organization_role_enum' already exists", är det för att enum-typen redan har skapats. Detta kan hända om du försöker köra en migration två gånger. Du kan hoppa över skapandet av enum-typen eller köra migrationerna med `IF NOT EXISTS`.

### Problem: Tabeller kan inte skapas på grund av saknade beroenden

Om du får fel relaterade till saknade tabeller (särskilt för `organization_invitations.sql`), se till att du har kört `organization_tables.sql` först.

### Problem: RLS-policy-konflikter

Om du får fel relaterade till RLS-policyer som redan existerar, kan du först ta bort befintliga policyer:

```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## Nästa steg efter migrationen

Efter att migrationen har körts framgångsrikt, redo att:

1. Starta applikationen och testa grundläggande funktionalitet
2. Skapa en organisations
3. Bjuda in medlemmar till organisationen
4. Acceptera och avvisa inbjudningar

Om du stöter på problem, kontrollera följande loggar:
- Applikationsloggar för JavaScript/React-fel
- Supabase-loggar för PostgreSQL-fel 