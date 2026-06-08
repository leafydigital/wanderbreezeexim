/*
  # Fix admin user password hash

  Updates the encrypted_password for ramfaizi using bcrypt cost factor 10,
  which is the format Supabase GoTrue expects.
*/

UPDATE auth.users
SET encrypted_password = crypt('Ramfaizi@44', gen_salt('bf', 10))
WHERE email = 'ramfaizi@wbe.internal';
