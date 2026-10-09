-- READ-ONLY. Run this before deciding what to do with the existing
-- `public.journals` table. It changes nothing.
--
-- Context: `schema.sql`'s guard found a `journals` table that is not the shape
-- this app expects and that holds 6 rows, and refused to drop it. These six
-- rows predate the current design and nobody currently knows what they are.
-- The three questions that decide the outcome are: what columns, how old, and
-- is there anything in them worth keeping.
--
-- Deliberately does NOT select the row contents. If this is an older journal
-- format those rows are personal entries, and they should be read by their
-- owner in the dashboard rather than pasted into a chat. Everything here is
-- metadata: names, types, sizes, dates.

-- 1 · What columns does it actually have?
select
  a.attname                                   as column_name,
  format_type(a.atttypid, a.atttypmod)        as type,
  a.attnotnull                                as not_null,
  pg_get_expr(d.adbin, d.adrelid)             as default_expr
from pg_attribute a
left join pg_attrdef d
  on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attrelid = 'public.journals'::regclass
  and a.attnum > 0
  and not a.attisdropped
order by a.attnum;

-- 2 · Is RLS on, and what policies exist today?
select
  c.relrowsecurity  as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.journals'::regclass;

select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.journals'::regclass;

-- 3 · How much is there, and how old? (sizes and dates only, no contents)
select
  count(*)                                    as rows,
  pg_size_pretty(pg_total_relation_size('public.journals')) as total_size
from public.journals;

-- 4 · A per-row fingerprint: how big is each row, and when was it touched?
--     Adapt the date column name if step 1 shows something different — if the
--     table has no timestamp at all, drop that line rather than guessing.
select
  ctid                                        as row_ref,
  pg_column_size(j.*)                         as bytes
from public.journals j
order by bytes desc;
