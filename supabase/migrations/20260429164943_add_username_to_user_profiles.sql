/*
  # Add username to user_profiles

  Adds a unique username field to user_profiles so users can log in
  with a username instead of an email address. The auth layer still
  uses Supabase email/password under the hood (we store username@internal
  as the email), but the UI only shows username.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
