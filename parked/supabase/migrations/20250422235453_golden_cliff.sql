/*
  # Fix team notification trigger function
  
  1. Changes
    - Add COALESCE protection for the notification message in notify_team_leaders_of_pending_approval
    - Ensure the message is never NULL even if the user's name is NULL
    - Add NULL check for team members to prevent constraint violations
    
  2. Security
    - Maintain SECURITY DEFINER attribute
    - Keep same permission checks and transaction handling
*/

CREATE OR REPLACE FUNCTION public.notify_team_leaders_of_pending_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if the new member has pending status
  IF NEW.approval_status = 'pending' THEN
    -- Notify team leaders and owners
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority
    )
    SELECT
      tm.user_id,
      'team_join',
      'New Team Member Request',
      COALESCE((SELECT name FROM profiles WHERE id = NEW.user_id), 'Someone') || ' has requested to join your team',
      jsonb_build_object(
        'team_id', NEW.team_id,
        'user_id', NEW.user_id,
        'requires_approval', true
      ),
      'high'
    FROM team_members tm
    WHERE tm.team_id = NEW.team_id
    AND tm.role IN ('leader', 'owner')
    AND tm.user_id != NEW.user_id
    AND tm.user_id IS NOT NULL;  -- Ensure user_id is not null
  END IF;
  
  RETURN NULL;
END;
$$;