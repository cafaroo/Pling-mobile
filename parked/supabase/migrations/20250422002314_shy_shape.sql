/*
  # Add team invite codes system
  
  1. New Functions
    - generate_team_invite_code: Generates unique 6-character codes
    - create_team_invite_code: Creates new invite codes for teams
    - join_team_with_code: Handles team joining via invite codes
    
  2. Security
    - Only team leaders can generate codes
    - Codes expire after use or time limit
    - Prevent code conflicts
*/

-- Create team invite codes table
CREATE TABLE IF NOT EXISTS public.team_invite_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    code text NOT NULL,
    created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(code)
);

-- Enable RLS
ALTER TABLE public.team_invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team leaders can manage invite codes"
ON team_invite_codes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_invite_codes.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_invite_codes.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_team_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding similar looking characters
    code text := '';
    i integer;
BEGIN
    -- Generate 6-character code
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists and regenerate if needed
    WHILE EXISTS (
        SELECT 1 FROM team_invite_codes 
        WHERE team_invite_codes.code = code
        AND (used_at IS NULL AND expires_at > now())
    ) LOOP
        code := '';
        FOR i IN 1..6 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN code;
END;
$$;

-- Function to create team invite code
CREATE OR REPLACE FUNCTION create_team_invite_code(team_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code text;
    code_record record;
BEGIN
    -- Check if user is team leader
    IF NOT check_team_leader(team_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Only team leaders can create invite codes'
        );
    END IF;
    
    -- Generate new code
    new_code := generate_team_invite_code();
    
    -- Create invite code
    INSERT INTO team_invite_codes (
        team_id,
        code,
        created_by,
        expires_at
    ) VALUES (
        team_id,
        new_code,
        auth.uid(),
        now() + interval '24 hours'
    )
    RETURNING * INTO code_record;
    
    RETURN json_build_object(
        'success', true,
        'code', new_code,
        'expires_at', code_record.expires_at
    );
END;
$$;

-- Function to join team with code
CREATE OR REPLACE FUNCTION join_team_with_code(invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record record;
BEGIN
    -- Get and validate code
    SELECT * INTO code_record
    FROM team_invite_codes
    WHERE code = upper(invite_code)
    AND used_at IS NULL
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invite code'
        );
    END IF;
    
    -- Check if user is already in team
    IF EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = code_record.team_id
        AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'You are already a member of this team'
        );
    END IF;
    
    -- Add user to team
    INSERT INTO team_members (
        team_id,
        user_id,
        role
    ) VALUES (
        code_record.team_id,
        auth.uid(),
        'member'
    );
    
    -- Mark code as used
    UPDATE team_invite_codes
    SET 
        used_at = now(),
        used_by = auth.uid()
    WHERE id = code_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Successfully joined team',
        'team_id', code_record.team_id
    );
END;
$$;