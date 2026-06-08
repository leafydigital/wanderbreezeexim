/*
  # Create password helper RPC functions

  These are security-definer functions called by edge functions to verify
  and hash passwords using pgcrypto, avoiding bcrypt npm package issues in Deno.

  - verify_user_password(username, password) → returns user row if valid
  - hash_password(password) → returns bcrypt hash
*/

-- Verify password and return user data (excludes password_hash)
CREATE OR REPLACE FUNCTION verify_user_password(p_username text, p_password text)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  email text,
  phone text,
  role_id uuid,
  is_active boolean,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.name, u.username, u.email, u.phone,
    u.role_id, u.is_active, u.avatar_url,
    u.last_login_at, u.created_at, u.updated_at,
    u.deleted_at, u.notes
  FROM users u
  WHERE u.username = lower(trim(p_username))
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.deleted_at IS NULL
    AND u.is_active = true;
END;
$$;

-- Hash a password with bcrypt cost 10
CREATE OR REPLACE FUNCTION hash_password(p_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$;

-- Update last_login_at for a user
CREATE OR REPLACE FUNCTION update_last_login(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET last_login_at = now() WHERE id = p_user_id;
END;
$$;
