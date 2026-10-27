-- Run after supabase_stub.sql and supabase/schema.sql. Each check prints PASS or FAIL.
\set ON_ERROR_STOP 0
insert into public.members(email, person, role) values ('lead@x.com','Lea','lead'),('mem@x.com','Mo','member'),('view@x.com','Vi','view'),('gone@x.com','Go','member');
update public.members set active=false where email='gone@x.com';
insert into public.docs(coll,id,data) values ('brands','b1','{"name":"B1","x":{"a":1,"b":2}}'),('config','lists','{"stage":["A"]}'),('data/users/11111111-1111-1111-1111-111111111111','profile','{"person":"Mo"}');
create or replace function pg_temp.as_user(email text, sub text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('email',email,'sub',sub)::text, false); end $$;
create temp table r(name text, ok boolean); grant all on r to authenticated, anon;
-- member
select pg_temp.as_user('mem@x.com','11111111-1111-1111-1111-111111111111'); set role authenticated;
insert into r select 'member reads brands', count(*)=1 from public.docs where coll='brands';
insert into r select 'member reads own profile', count(*)=1 from public.docs where coll like 'data/users/%';
select public.doc_merge('brands','b1','{"x":{"b":3,"c":4},"y":null}');
insert into r select 'deep merge keeps a, changes b, adds c', data='{"name":"B1","x":{"a":1,"b":3,"c":4},"y":null}' from public.docs where coll='brands' and id='b1';
select public.doc_merge('tasks','t1','{"title":"New"}');
insert into r select 'merge creates a missing record', count(*)=1 from public.docs where coll='tasks' and id='t1';
do $$ begin begin update public.docs set data='{}' where coll='config'; exception when others then null; end; end $$;
insert into r select 'member cannot change config', data='{"stage":["A"]}' from public.docs where coll='config';
do $$ begin begin insert into public.docs(coll,id,data) values ('steps','s1','{}'); insert into r values ('member cannot add steps', false); exception when others then insert into r values ('member cannot add steps', true); end; end $$;
do $$ begin begin insert into public.members(email) values ('new@x.com'); insert into r values ('member cannot add members', false); exception when others then insert into r values ('member cannot add members', true); end; end $$;
reset role;
-- view
select pg_temp.as_user('view@x.com','22222222-2222-2222-2222-222222222222'); set role authenticated;
insert into r select 'view reads brands', count(*)=1 from public.docs where coll='brands';
insert into r select 'view cannot read someone else''s profile', count(*)=0 from public.docs where coll like 'data/users/%';
do $$ begin begin perform public.doc_merge('brands','b1','{"name":"Hacked"}'); insert into r values ('view cannot change brands', false); exception when others then insert into r values ('view cannot change brands', true); end; end $$;
do $$ begin begin insert into public.docs(coll,id,data) values ('data/users/22222222-2222-2222-2222-222222222222','profile','{"person":"Vi"}'); insert into r values ('view can save own profile', true); exception when others then insert into r values ('view can save own profile', false); end; end $$;
reset role;
-- inactive and unknown people
select pg_temp.as_user('gone@x.com','33333333-3333-3333-3333-333333333333'); set role authenticated;
insert into r select 'inactive member sees nothing', count(*)=0 from public.docs;
reset role;
select pg_temp.as_user('stranger@y.com','44444444-4444-4444-4444-444444444444'); set role authenticated;
insert into r select 'stranger sees nothing', count(*)=0 from public.docs;
insert into r select 'stranger sees no members', count(*)=0 from public.members;
do $$ begin begin perform public.doc_merge('brands','b9','{}'); insert into r values ('stranger cannot write', false); exception when others then insert into r values ('stranger cannot write', true); end; end $$;
reset role;
set role anon;
do $$ begin begin perform count(*) from public.docs; insert into r values ('signed-out cannot read', false); exception when others then insert into r values ('signed-out cannot read', true); end; end $$;
reset role;
-- lead
select pg_temp.as_user('lead@x.com','55555555-5555-5555-5555-555555555555'); set role authenticated;
select public.doc_merge('config','lists','{"stage":["A","B"]}');
insert into r select 'lead changes config', data->'stage'='["A","B"]' from public.docs where coll='config';
insert into public.members(email,person) values ('new@x.com','Nu');
insert into r select 'lead adds a member', count(*)=1 from public.members where email='new@x.com';
delete from public.docs where coll='tasks' and id='t1';
insert into r select 'lead deletes a record', count(*)=0 from public.docs where coll='tasks';
reset role;
insert into r select 'docs is in the live-updates publication', count(*)=1 from pg_publication_tables where pubname='supabase_realtime' and tablename='docs';
select case when ok then 'PASS' else 'FAIL' end as result, name from r;
select count(*) filter (where ok) || ' of ' || count(*) || ' database checks pass' as summary from r;
