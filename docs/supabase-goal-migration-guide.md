# Guide för att migrera Goal-modulen till Supabase med MCP

Detta är en steg-för-steg-guide för att applicera goal-migrationen till Pling-projektets Supabase-databas med hjälp av MCP-verktyget i Cursor.

## Steg 1: Säkerhetskopiera databasen

Skapa först en säkerhetskopia av databasen genom att köra en backup-migration:

```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "goal_schema_backup",
  query: "CREATE TABLE IF NOT EXISTS schema_backups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), backup_name text NOT NULL, backup_date timestamptz NOT NULL DEFAULT now(), backup_data jsonb); INSERT INTO schema_backups (backup_name, backup_data) SELECT 'pre_goal_migration_backup', jsonb_build_object('goals', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM goals) t), 'goal_milestones', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM goal_milestones) t));"
)
```

## Steg 2: Kör migrationsskriptet

Använd MCP för att köra huvudmigrationsskriptet:

```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_20250605",
  query: <HELA INNEHÅLLET I supabase/migrations/20250605000000_update_goals_schema.sql>
)
```

Om du får ett fel om att argumentet är för stort, dela upp migrationen i mindre delar:

### Del 1: Backup och förbereda tabeller
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part1",
  query: "-- Backup av existerande data (om någon)
CREATE TABLE IF NOT EXISTS goals_backup AS SELECT * FROM goals;
CREATE TABLE IF NOT EXISTS goal_milestones_backup AS SELECT * FROM goal_milestones;
CREATE TABLE IF NOT EXISTS goal_entries_backup AS SELECT * FROM goal_entries;

-- Radera begränsningar för att förenkla uppdateringen
ALTER TABLE IF EXISTS goal_milestones DROP CONSTRAINT IF EXISTS goal_milestones_goal_id_fkey;
DROP TRIGGER IF EXISTS update_goal_progress ON goal_entries;

-- Radera existerande tabeller efter backup
DROP TABLE IF EXISTS goal_entries;
DROP TABLE IF EXISTS goal_milestones;"
)
```

### Del 2: Uppdatera goals-tabellen
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part2",
  query: "-- Uppdatera goals-tabellen
ALTER TABLE IF EXISTS goals
  -- Ta bort kolumner som inte längre används
  DROP COLUMN IF EXISTS period,
  -- Ändra namn på target_value och current_value
  DROP COLUMN IF EXISTS target_value,
  DROP COLUMN IF EXISTS current_value,
  -- Ta bort andra kolumner som inte matchar nya schemat
  DROP COLUMN IF EXISTS assignee_type;

-- Radera begränsningar som kan störa uppdateringen
ALTER TABLE IF EXISTS goals DROP CONSTRAINT IF EXISTS goals_check;
ALTER TABLE IF EXISTS goals DROP CONSTRAINT IF EXISTS goals_type_check;
ALTER TABLE IF EXISTS goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE IF EXISTS goals DROP CONSTRAINT IF EXISTS goals_period_check;

-- Lägg till nya kolumner i goals
ALTER TABLE IF EXISTS goals
  ADD COLUMN IF NOT EXISTS target numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS current numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('performance', 'learning', 'habit', 'project', 'other')) DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS status text NOT NULL CHECK (status IN ('active', 'completed', 'canceled', 'paused')) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS scope text NOT NULL CHECK (scope IN ('individual', 'team')) DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS parent_goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Skapa nya constraints för goals
ALTER TABLE IF EXISTS goals 
  ADD CONSTRAINT goals_scope_check CHECK (
    (scope = 'individual' AND team_id IS NULL) OR 
    (scope = 'team' AND team_id IS NOT NULL)
  );"
)
```

### Del 3: Skapa nya tabeller
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part3",
  query: "-- Milestones-tabell (ersätter goal_milestones)
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_date timestamptz,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  \"order\" integer NOT NULL DEFAULT 0
);

-- Taggs för mål
CREATE TABLE IF NOT EXISTS goal_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Relation mellan mål och taggar
CREATE TABLE IF NOT EXISTS goal_tag_relations (
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES goal_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (goal_id, tag_id)
);

-- Goal relations
CREATE TABLE IF NOT EXISTS goal_relations (
  source_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  target_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('parent', 'child', 'related')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_goal_id, target_goal_id)
);

-- Målframstegslogg
CREATE TABLE IF NOT EXISTS goal_progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  previous_value numeric NOT NULL,
  new_value numeric NOT NULL,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);"
)
```

### Del 4: Konfigurera RLS
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part4",
  query: "-- Sätt upp RLS
ALTER TABLE IF EXISTS milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goal_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goal_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goal_progress_logs ENABLE ROW LEVEL SECURITY;

-- Skapa policies för milestones
CREATE POLICY \"Användare kan se milestones för synliga mål\"
ON milestones
FOR SELECT
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND status = 'active'
        ))
    )
);

CREATE POLICY \"Användare kan hantera milestones för egna mål\"
ON milestones
FOR ALL
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
);"
)
```

### Del 5: Tag och Relations RLS
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part5",
  query: "-- Skapa policies för goal_tags
CREATE POLICY \"Användare kan se alla taggar\"
ON goal_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY \"Användare kan hantera egna taggar\"
ON goal_tags
FOR ALL
TO authenticated
USING (created_by = auth.uid());

-- Skapa policies för goal_tag_relations
CREATE POLICY \"Användare kan se alla tag-relationer\"
ON goal_tag_relations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY \"Användare kan hantera egna mål-tagg-relationer\"
ON goal_tag_relations
FOR ALL
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
);

-- Skapa policies för goal_relations
CREATE POLICY \"Användare kan se alla mål-relationer\"
ON goal_relations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY \"Användare kan hantera egna mål-relationer\"
ON goal_relations
FOR ALL
TO authenticated
USING (
    source_goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
);"
)
```

### Del 6: Progress Logs RLS och Triggers
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part6",
  query: "-- Skapa policies för goal_progress_logs
CREATE POLICY \"Användare kan se framstegsloggar för sina mål\"
ON goal_progress_logs
FOR SELECT
TO authenticated
USING (
    goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND status = 'active'
        ))
    )
);

CREATE POLICY \"Användare kan lägga till framstegsloggar för sina mål\"
ON goal_progress_logs
FOR INSERT
TO authenticated
WITH CHECK (
    goal_id IN (
        SELECT id FROM goals
        WHERE (scope = 'individual' AND created_by = auth.uid()) OR
        (scope = 'team' AND team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND status = 'active'
        ))
    )
);

-- Trigger för att uppdatera goals
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Uppdatera mål när en framstegslogg läggs till
    UPDATE goals
    SET current = NEW.new_value,
        status = CASE 
            WHEN NEW.new_value >= target AND status = 'active' THEN 'completed'
            ELSE status
        END,
        updated_at = now()
    WHERE id = NEW.goal_id;
    
    -- Uppdatera milestones om målet har uppnått dem
    UPDATE milestones
    SET 
        is_completed = true,
        completed_at = now()
    WHERE goal_id = NEW.goal_id
    AND is_completed = false
    AND target_date IS NOT NULL
    AND target_date <= now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_on_progress_log
    AFTER INSERT ON goal_progress_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();"
)
```

### Del 7: Statistikfunktioner
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part7",
  query: "-- Funktion för att hämta användarens målstatistik
CREATE OR REPLACE FUNCTION get_user_goal_stats(p_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    completed_goals bigint,
    active_goals bigint,
    average_completion numeric,
    team_contributions bigint,
    last_activity timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_user_id,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END),
        COUNT(CASE WHEN g.status = 'active' THEN 1 END),
        COALESCE(AVG(CASE 
            WHEN g.target = 0 THEN 0 
            ELSE (g.current / g.target * 100) 
        END), 0),
        (
            SELECT COUNT(*)
            FROM goal_progress_logs gpl
            JOIN goals tg ON gpl.goal_id = tg.id
            WHERE gpl.changed_by = p_user_id
            AND tg.scope = 'team'
        ),
        (
            SELECT MAX(created_at)
            FROM goal_progress_logs
            WHERE changed_by = p_user_id
        )
    FROM goals g
    WHERE g.created_by = p_user_id OR g.assignee_id = p_user_id;
END;
$$;

-- Funktion för att hämta team-målstatistik
CREATE OR REPLACE FUNCTION get_team_goal_stats(p_team_id uuid)
RETURNS TABLE (
    team_id uuid,
    completed_goals bigint,
    active_goals bigint,
    average_completion numeric,
    top_contributors json
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_team_id,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END),
        COUNT(CASE WHEN g.status = 'active' THEN 1 END),
        COALESCE(AVG(CASE 
            WHEN g.target = 0 THEN 0 
            ELSE (g.current / g.target * 100) 
        END), 0),
        (
            SELECT json_agg(t)
            FROM (
                SELECT 
                    p.id AS user_id, 
                    p.name, 
                    p.avatar_url,
                    COUNT(gpl.id) AS contributions
                FROM goal_progress_logs gpl
                JOIN goals g ON gpl.goal_id = g.id
                JOIN profiles p ON gpl.changed_by = p.id
                WHERE g.team_id = p_team_id
                GROUP BY p.id, p.name, p.avatar_url
                ORDER BY COUNT(gpl.id) DESC
                LIMIT 5
            ) t
        )
    FROM goals g
    WHERE g.team_id = p_team_id;
END;
$$;"
)
```

### Del 8: Goals RLS Policies
```
mcp_supabase_apply_migration(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  name: "update_goals_schema_part8",
  query: "-- Uppdatera RLS-policies för goals
CREATE OR REPLACE POLICY \"Användare kan se egna mål och teammål\"
ON goals
FOR SELECT
TO authenticated
USING (
    (scope = 'individual' AND (created_by = auth.uid() OR assignee_id = auth.uid())) OR
    (scope = 'team' AND team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND status = 'active'
    ))
);

CREATE OR REPLACE POLICY \"Användare kan skapa egna mål och teammål\"
ON goals
FOR INSERT
TO authenticated
WITH CHECK (
    (scope = 'individual' AND created_by = auth.uid()) OR
    (scope = 'team' AND team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
);

CREATE OR REPLACE POLICY \"Användare kan uppdatera egna mål\"
ON goals
FOR UPDATE
TO authenticated
USING (
    (scope = 'individual' AND created_by = auth.uid()) OR
    (scope = 'team' AND team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
);

CREATE OR REPLACE POLICY \"Användare kan ta bort egna mål\"
ON goals
FOR DELETE
TO authenticated
USING (
    (scope = 'individual' AND created_by = auth.uid()) OR
    (scope = 'team' AND team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
);"
)
```

## Steg 3: Verifiera migrationen

Kontrollera att tabellerna har skapats korrekt:

```
mcp_supabase_execute_sql(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('goals', 'milestones', 'goal_tags', 'goal_tag_relations', 'goal_relations', 'goal_progress_logs');"
)
```

Testa att skapa ett mål:

```
mcp_supabase_execute_sql(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  query: "INSERT INTO goals (title, description, type, scope, target, created_by) VALUES ('Test mål', 'Ett testmål för att verifiera migrationen', 'project', 'individual', 100, '00000000-0000-0000-0000-000000000000') RETURNING *;"
)
```
(Ändra användar-ID i exemplet ovan till ditt eget)

## Steg 4: Uppdatera Dokumentation

När migrationen är klar, uppdatera status i `docs/goal_tasks.md`:

```
mcp_supabase_execute_sql(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  query: "SELECT 'Migrationen slutfördes framgångsrikt ' || now();"
)
```

## Felsökning

Om du stöter på problem med migrationen, granska felmeddelanden och prova att köra de problematiska delarna separat. Om du behöver återställa:

```
mcp_supabase_execute_sql(
  project_id: "dgrmxelwxeoyiwzoqjsj",
  query: "SELECT * FROM schema_backups WHERE backup_name = 'pre_goal_migration_backup';"
)
``` 