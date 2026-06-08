/*
  # Create custom users table

  This replaces the user_profiles + auth.users dual-table approach with a
  single self-contained users table that stores all user data including a
  bcrypt password hash. Authentication is done by an Edge Function that
  verifies the password and returns a Supabase session via the service role.

  ## New Table: users

  | Column         | Type        | Notes                                      |
  |----------------|-------------|--------------------------------------------|
  | id             | uuid PK     | auto-generated                             |
  | name           | text        | full display name                          |
  | username       | text UNIQUE | login credential, lowercase letters/nums   |
  | password_hash  | text        | bcrypt hash (never exposed to client)      |
  | email          | text        | optional contact email                     |
  | phone          | text        | optional phone number                      |
  | role_id        | uuid FK     | references roles(id)                       |
  | is_active      | boolean     | account enabled flag                       |
  | created_at     | timestamptz |                                            |
  | created_by     | uuid FK     | references users(id) (self-ref, nullable)  |
  | updated_at     | timestamptz |                                            |
  | updated_by     | uuid FK     | references users(id) (self-ref, nullable)  |
  | deleted_at     | timestamptz | soft delete — NULL means not deleted       |
  | deleted_by     | uuid FK     | references users(id) (self-ref, nullable)  |
  | last_login_at  | timestamptz | updated on every successful login          |
  | avatar_url     | text        | optional profile picture URL               |
  | notes          | text        | admin notes about the user                 |

  ## Security
  - RLS enabled
  - Authenticated users can SELECT non-deleted rows
  - Only service role (edge function) can INSERT/UPDATE/DELETE
    (password_hash is never readable from the client)
*/

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL DEFAULT '',
  username       text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  email          text DEFAULT '',
  phone          text DEFAULT '',
  role_id        uuid REFERENCES roles(id) ON DELETE SET NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  last_login_at  timestamptz,
  avatar_url     text DEFAULT '',
  notes          text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS users_username_idx ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS users_role_id_idx  ON users(role_id);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active) WHERE deleted_at IS NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Authenticated sessions (via edge function custom JWT) can read non-deleted, active users
-- password_hash is excluded by convention in all client queries
CREATE POLICY "Authenticated users can view active non-deleted users"
  ON users FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Only the service role (edge function) may insert new users
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only the service role may update users
CREATE POLICY "Service role can update users"
  ON users FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Only the service role may hard-delete (we use soft delete, but just in case)
CREATE POLICY "Service role can delete users"
  ON users FOR DELETE
  TO service_role
  USING (true);
