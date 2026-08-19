-- Local-only seed, run by `supabase db reset` (see [db.seed] in config.toml).
--
-- Nothing here is a real credential. Change the email and password before you
-- use this, and never point it at a cloud project.
do $$
declare
  v_user_id  uuid := '00000000-0000-4000-8000-000000000001';
  v_email    text := 'dev@example.test';
  v_password text := 'change-me-locally';
begin
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    encrypted_password, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', v_email, now(),
    crypt(v_password, gen_salt('bf')),
    -- is_admin gates apps/backoffice: middleware/check-admin.ts on the server,
    -- lib/auth.ts#isAdminSession in the browser.
    '{"provider":"email","providers":["email"],"is_admin":true}'::jsonb,
    '{}'::jsonb, '', '', '', '', now(), now()
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider, provider_id, identity_data,
    created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_user_id, 'email', v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email,
                       'email_verified', true),
    now(), now(), now()
  )
  on conflict do nothing;

  insert into app.items (user_id, name, notes)
  values (v_user_id, 'First item',
          'Seeded by apps/supabase/supabase/seeds/init.sql')
  on conflict do nothing;
end $$;
