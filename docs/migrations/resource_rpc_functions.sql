-- RPC-funktioner för optimerad resursbegränsningshantering

-- Funktion för att hämta alla resursbegränsningar med aktuell användning för en organisation
CREATE OR REPLACE FUNCTION get_organization_resource_limits(
  p_organization_id UUID,
  p_plan_id UUID
)
RETURNS TABLE (
  resource_type TEXT,
  limit_value INTEGER,
  current_usage INTEGER,
  display_name TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.resource_type::TEXT, 
    rl.limit_value,
    COALESCE(ru.current_usage, 0) AS current_usage,
    rl.display_name,
    rl.description
  FROM 
    resource_limits rl
  LEFT JOIN 
    resource_usage ru 
      ON ru.resource_type = rl.resource_type 
      AND ru.organization_id = p_organization_id
  WHERE 
    rl.plan_type = p_plan_id;
END;
$$;

-- Funktion för att hämta aktuell användning för en specifik resurstyp
CREATE OR REPLACE FUNCTION get_resource_usage(
  p_organization_id UUID,
  p_resource_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_usage INTEGER;
BEGIN
  SELECT 
    COALESCE(current_usage, 0) INTO v_current_usage
  FROM 
    resource_usage
  WHERE 
    organization_id = p_organization_id
    AND resource_type = p_resource_type::resource_type;
    
  RETURN COALESCE(v_current_usage, 0);
END;
$$;

-- Funktion för att spåra resursanvändning med möjlighet att generera notifikationer
CREATE OR REPLACE FUNCTION track_resource_usage(
  p_organization_id UUID,
  p_resource_type TEXT,
  p_increment_by INTEGER DEFAULT 1,
  p_silent_mode BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  notification_sent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_usage INTEGER;
  v_limit_value INTEGER;
  v_plan_id UUID;
  v_notification_sent BOOLEAN := FALSE;
  v_over_limit BOOLEAN := FALSE;
  v_approaching_limit BOOLEAN := FALSE;
  v_resource_display_name TEXT;
BEGIN
  -- Hämta organisationens plan
  SELECT plan_id INTO v_plan_id
  FROM subscriptions
  WHERE organization_id = p_organization_id;
  
  IF v_plan_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Ingen prenumerationsplan hittades för organisationen', FALSE;
    RETURN;
  END IF;
  
  -- Hämta resursgränsen för planen
  SELECT 
    limit_value, display_name INTO v_limit_value, v_resource_display_name
  FROM 
    resource_limits
  WHERE 
    plan_type = v_plan_id
    AND resource_type = p_resource_type::resource_type;
  
  IF v_limit_value IS NULL THEN
    RETURN QUERY SELECT TRUE, 'Ingen begränsning för denna resurstyp', FALSE;
    RETURN;
  END IF;
  
  -- Uppdatera användning med UPSERT
  INSERT INTO resource_usage (
    organization_id, 
    resource_type, 
    current_usage, 
    last_updated
  )
  VALUES (
    p_organization_id, 
    p_resource_type::resource_type, 
    p_increment_by,
    NOW()
  )
  ON CONFLICT (organization_id, resource_type) 
  DO UPDATE SET 
    current_usage = resource_usage.current_usage + p_increment_by,
    last_updated = NOW()
  RETURNING current_usage INTO v_current_usage;
  
  -- Kontrollera begränsning och skicka notifikationer om nödvändigt
  IF NOT p_silent_mode THEN
    -- Över gränsen
    IF v_current_usage > v_limit_value THEN
      v_over_limit := TRUE;
      
      -- Skicka notifikation till administratörer
      INSERT INTO notifications (
        id,
        user_id,
        title,
        body,
        type,
        metadata,
        is_read,
        created_at
      )
      SELECT 
        gen_random_uuid(),
        om.user_id,
        'Resursgräns överskriden',
        v_resource_display_name || ' har överskridit maxgränsen (' || v_limit_value || ')',
        'resource_limit_exceeded',
        json_build_object(
          'organization_id', p_organization_id,
          'resource_type', p_resource_type,
          'current_usage', v_current_usage,
          'limit_value', v_limit_value
        ),
        FALSE,
        NOW()
      FROM 
        organization_members om
      WHERE 
        om.organization_id = p_organization_id
        AND om.role IN ('admin', 'owner');
        
      v_notification_sent := TRUE;
    
    -- Närmar sig gränsen (80%)
    ELSIF v_current_usage >= (v_limit_value * 0.8) AND v_current_usage < v_limit_value THEN
      v_approaching_limit := TRUE;
      
      -- Skicka notifikation till administratörer
      INSERT INTO notifications (
        id,
        user_id,
        title,
        body,
        type,
        metadata,
        is_read,
        created_at
      )
      SELECT 
        gen_random_uuid(),
        om.user_id,
        'Närmar sig resursgräns',
        v_resource_display_name || ' närmar sig maxgränsen (' || v_current_usage || ' av ' || v_limit_value || ')',
        'resource_limit_approaching',
        json_build_object(
          'organization_id', p_organization_id,
          'resource_type', p_resource_type,
          'current_usage', v_current_usage,
          'limit_value', v_limit_value,
          'percentage', (v_current_usage::float / v_limit_value::float) * 100
        ),
        FALSE,
        NOW()
      FROM 
        organization_members om
      WHERE 
        om.organization_id = p_organization_id
        AND om.role IN ('admin', 'owner');
        
      v_notification_sent := TRUE;
    END IF;
  END IF;
  
  -- Spåra användningshistorik
  INSERT INTO resource_usage_history (
    organization_id,
    resource_type,
    usage_value,
    recorded_at
  )
  VALUES (
    p_organization_id,
    p_resource_type::resource_type,
    v_current_usage,
    NOW()
  );
  
  -- Returnera resultat
  IF v_over_limit THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Resursgränsen har överskridits: ' || v_current_usage || ' av ' || v_limit_value || ' ' || v_resource_display_name,
      v_notification_sent;
  ELSE
    RETURN QUERY SELECT 
      TRUE, 
      'Resursanvändning uppdaterad: ' || v_current_usage || ' av ' || v_limit_value || ' ' || v_resource_display_name,
      v_notification_sent;
  END IF;
END;
$$;

-- Funktion för att hämta alla resursanvändningar för dashboard
CREATE OR REPLACE FUNCTION get_organization_resource_dashboard(
  p_organization_id UUID
)
RETURNS TABLE (
  resource_type TEXT,
  current_usage INTEGER,
  limit_value INTEGER,
  percentage NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH org_plan AS (
    SELECT plan_id
    FROM subscriptions
    WHERE organization_id = p_organization_id
  )
  SELECT 
    rl.resource_type::TEXT,
    COALESCE(ru.current_usage, 0) AS current_usage,
    rl.limit_value,
    ROUND((COALESCE(ru.current_usage, 0)::NUMERIC / NULLIF(rl.limit_value, 0)::NUMERIC) * 100, 1) AS percentage,
    CASE 
      WHEN COALESCE(ru.current_usage, 0) >= rl.limit_value THEN 'exceeded'
      WHEN COALESCE(ru.current_usage, 0) >= (rl.limit_value * 0.8) THEN 'warning'
      ELSE 'ok'
    END AS status
  FROM 
    resource_limits rl
  JOIN 
    org_plan op ON rl.plan_type = op.plan_id
  LEFT JOIN 
    resource_usage ru 
      ON ru.resource_type = rl.resource_type 
      AND ru.organization_id = p_organization_id
  ORDER BY 
    percentage DESC;
END;
$$; 