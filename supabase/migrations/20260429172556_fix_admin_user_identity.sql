/*
  # Fix admin user identity record

  GoTrue requires a row in auth.identities for email/password login to work.
  The ramfaizi user was inserted directly into auth.users but the corresponding
  identity record was never created. This migration adds it.
*/

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '032056c6-5e42-4564-bb8d-34b405b74f78',
  '032056c6-5e42-4564-bb8d-34b405b74f78',
  'ramfaizi@wbe.internal',
  jsonb_build_object(
    'sub', '032056c6-5e42-4564-bb8d-34b405b74f78',
    'email', 'ramfaizi@wbe.internal',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
