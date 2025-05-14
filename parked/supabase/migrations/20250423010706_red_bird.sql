/*
  # Add policy for users to read their own team invitations
  
  1. Changes
    - Add RLS policy to allow users to read team invitations sent to their email
    - This fixes the issue where users can't see their pending invitations
    
  2. Security
    - Only allows users to see invitations sent to their own email address
    - Maintains existing security model
*/

-- Create policy to allow users to read their own invitations
CREATE POLICY "Allow invited user to read their invitation"
ON team_invitations
FOR SELECT
TO authenticated
USING (
  email = auth.email()
);