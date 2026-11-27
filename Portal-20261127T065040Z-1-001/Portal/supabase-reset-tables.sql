-- DESTRUCTIVE: permanently drops user tables and their data in non-system schemas.
-- Run in Supabase SQL Editor as the project owner, after taking a database backup.
-- Supabase-managed schemas and extension-owned tables are excluded.
-- CASCADE also removes dependent objects such as views and foreign-key constraints.

begin;

do $$
declare
  target record;
begin
  for target in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and n.nspname <> 'information_schema'
      and left(n.nspname, 3) <> 'pg_'
      and left(n.nspname, 9) <> 'supabase_'
      and n.nspname not in (
        'auth',
        'storage',
        'extensions',
        'graphql',
        'graphql_public',
        'vault',
        'realtime',
        'net',
        'cron',
        'supabase_functions',
        'supabase_migrations',
        'supabase_admin',
        'supabase_internal',
        'pgbouncer',
        'pgsodium',
        'pgsodium_masks',
        'topology',
        'tiger',
        'tiger_data'
      )
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = c.oid
          and d.deptype = 'e'
      )
    order by n.nspname, c.relname
  loop
    raise notice 'Dropping table %.%', target.schema_name, target.table_name;
    execute format(
      'drop table if exists %I.%I cascade',
      target.schema_name,
      target.table_name
    );
  end loop;
end
$$;

commit;
