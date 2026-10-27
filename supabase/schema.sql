-- Valerie COE Tracker: database for the website version.
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run. Safe to run again.
--
-- One table holds every record the app keeps (brands, tasks, steps, access, SOW, comments and so on),
-- the same way the claude.ai version stores them, so moving the data is a straight copy.
-- A second table, members, says who may sign in and what they may do:
--   lead   = Lead / admin: everything, including Settings, the step list and deletes
--   member = can change brands, tasks, steps, access, SOW, comments
--   view   = can read only
-- Anyone not in members (or set inactive) sees nothing, even if they can sign in.

create table if not exists public.members (
  email      text primary key check (email = lower(email)),
  person     text not null default '',
  role       text not null default 'member' check (role in ('lead', 'member', 'view')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.docs (
  coll       text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (coll, id)
);

-- Deletes reach other open pages with the record's key.
alter table public.docs replica identity full;

-- The signed-in person's role, or null if they are not an active member.
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.members
  where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active
$$;

-- Each person's private profile lives at data/users/<their id>.
create or replace function public.own_private(p_coll text) returns boolean
language sql stable as $$
  select p_coll not like 'data/users/%' or p_coll = 'data/users/' || coalesce(auth.uid()::text, '-')
$$;

-- Who may change a collection. Lists, people and the step list are for leads only.
create or replace function public.may_write(p_coll text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when p_coll like 'data/users/%' then public.own_private(p_coll) and public.my_role() is not null
    when p_coll in ('config', 'steps') then public.my_role() = 'lead'
    else public.my_role() in ('lead', 'member')
  end
$$;

-- Merge a change into a record, folder by folder (objects merge, everything else is replaced).
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; v jsonb; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or b is null or jsonb_typeof(b) <> 'object' then return b; end if;
  r := a;
  for k, v in select * from jsonb_each(b) loop
    if jsonb_typeof(r -> k) = 'object' and jsonb_typeof(v) = 'object' then
      r := jsonb_set(r, array[k], public.jsonb_deep_merge(r -> k, v));
    else
      r := r || jsonb_build_object(k, v);
    end if;
  end loop;
  return r;
end $$;

-- Used by the app for "update": merges into the record, or creates it. Runs with the caller's rights.
create or replace function public.doc_merge(p_coll text, p_id text, p_patch jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.docs as d (coll, id, data, updated_at, updated_by)
  values (p_coll, p_id, p_patch, now(), auth.uid())
  on conflict (coll, id) do update
    set data = public.jsonb_deep_merge(d.data, excluded.data), updated_at = now(), updated_by = auth.uid();
end $$;

alter table public.members enable row level security;
alter table public.docs enable row level security;

drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated
  using (public.my_role() is not null);
drop policy if exists members_lead_write on public.members;
create policy members_lead_write on public.members for all to authenticated
  using (public.my_role() = 'lead') with check (public.my_role() = 'lead');

drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (public.my_role() is not null and public.own_private(coll));
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated
  with check (public.may_write(coll));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using (public.may_write(coll)) with check (public.may_write(coll));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using (public.may_write(coll));

revoke all on public.docs, public.members from anon;
grant select, insert, update, delete on public.docs, public.members to authenticated;
grant execute on function public.doc_merge(text, text, jsonb) to authenticated;
revoke execute on function public.doc_merge(text, text, jsonb) from anon;

-- Live updates: other people's changes appear without reloading.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;
