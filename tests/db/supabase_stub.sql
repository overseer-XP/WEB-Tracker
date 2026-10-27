-- Stand-ins for what Supabase provides, so supabase/schema.sql can be tested on plain Postgres.
create role anon nologin; create role authenticated nologin;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create publication supabase_realtime;
