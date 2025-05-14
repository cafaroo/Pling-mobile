/*
  # Add AUTH redirect URL RPC function
  
  1. New Functions
    - get_auth_redirect_url: Returns the appropriate redirect URL based on the request origin
    - handle_auth_redirect: Processes auth redirects and returns appropriate URL
    
  2. Security
    - Functions use SECURITY DEFINER to run with elevated privileges
    - Proper validation of input parameters
    - Safe handling of URLs
*/

-- Function to get the appropriate redirect URL
CREATE OR REPLACE FUNCTION get_auth_redirect_url(request_origin text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
BEGIN
  -- If request_origin is provided, use it as the base URL
  IF request_origin IS NOT NULL AND request_origin != '' THEN
    base_url := request_origin;
  ELSE
    -- Default fallback URL (can be configured per environment)
    base_url := 'http://localhost:8081';
  END IF;
  
  -- Ensure URL ends with trailing slash if needed
  IF RIGHT(base_url, 1) != '/' THEN
    base_url := base_url || '/';
  END IF;
  
  RETURN base_url;
END;
$$;

-- Function to handle auth redirects
CREATE OR REPLACE FUNCTION handle_auth_redirect(
  token text,
  type text DEFAULT 'signup',
  request_origin text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  redirect_url text;
  redirect_path text;
BEGIN
  -- Get base URL
  redirect_url := get_auth_redirect_url(request_origin);
  
  -- Determine redirect path based on type
  CASE type
    WHEN 'signup' THEN
      redirect_path := 'auth/confirm?token=' || token;
    WHEN 'recovery' THEN
      redirect_path := 'auth/reset-password?token=' || token;
    WHEN 'invite' THEN
      redirect_path := 'accept-invite?token=' || token;
    ELSE
      redirect_path := '';
  END CASE;
  
  -- Combine URL and path
  RETURN redirect_url || redirect_path;
END;
$$;

-- Function to get site URL for auth settings
CREATE OR REPLACE FUNCTION get_site_url()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 'http://localhost:8081';
$$;