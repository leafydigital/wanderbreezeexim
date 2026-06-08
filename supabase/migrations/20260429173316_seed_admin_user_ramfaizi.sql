/*
  # Seed admin user ramfaizi into custom users table

  Inserts the initial admin user with a bcrypt-hashed password (cost 10).
  Username: ramfaizi
  Password: Ramfaizi@44
  Role: Admin
*/

DO $$
DECLARE
  v_admin_role_id uuid := '5f2d8805-6bcc-4e2e-a932-a9ffdbad8e9d';
BEGIN
  INSERT INTO users (id, name, username, password_hash, email, phone, role_id, is_active, notes)
  VALUES (
    gen_random_uuid(),
    'Ram Faizi',
    'ramfaizi',
    crypt('Ramfaizi@44', gen_salt('bf', 10)),
    '',
    '',
    v_admin_role_id,
    true,
    'Initial admin account'
  )
  ON CONFLICT (username) DO NOTHING;
END $$;
