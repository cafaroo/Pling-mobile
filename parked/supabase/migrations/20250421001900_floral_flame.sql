/*
  # Add team invitations system
  
  1. New Tables
    - `team_invitations`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `email` (text)
      - `role` (text)
      - `token` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `accepted_at` (timestamptz)
  
  2. Security
    - Enable RLS on invitations table
    - Add policies for team leaders
    - Add function to generate invitation token
*/

-- Create team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('member', 'leader')),
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team leaders can manage invitations"
ON team_invitations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
);

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE sql
AS $$
    SELECT encode(gen_random_bytes(32), 'hex');
$$;