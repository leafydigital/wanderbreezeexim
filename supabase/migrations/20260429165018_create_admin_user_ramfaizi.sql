/*
  # Create Admin User: ramfaizi

  Creates the auth.users entry and matching user_profile for the
  initial admin user with username 'ramfaizi'.
  Email stored internally as ramfaizi@wbe.internal.
*/

DO $$
DECLARE
  v_user_id uuid;
  v_admin_role_id uuid;
BEGIN
  -- Get Admin role id
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ramfaizi@wbe.internal' LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Insert into auth.users with bcrypt-hashed password for 'Ramfaizi@44'
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'ramfaizi@wbe.internal',
      crypt('Ramfaizi@44', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ram Faizi"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    ) RETURNING id INTO v_user_id;
  END IF;

  -- Insert or update user_profile
  INSERT INTO user_profiles (id, full_name, username, role_id, is_active)
  VALUES (v_user_id, 'Ram Faizi', 'ramfaizi', v_admin_role_id, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Ram Faizi',
    username = 'ramfaizi',
    role_id = v_admin_role_id,
    is_active = true;

END $$;
