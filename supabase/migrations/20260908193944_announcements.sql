-- Editorial notices; publication and the homepage display window are independent.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title text not null check (length(trim(title)) between 1 and 80),
  subtitle text not null default '' check (length(subtitle) <= 120),
  description text not null default '' check (length(description) <= 180),
  content text not null default '' check (length(content) <= 30000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  check (ends_at > starts_at and isfinite(starts_at) and isfinite(ends_at))
);
create index announcements_public_schedule_idx on public.announcements (starts_at desc, created_at desc, id desc) include (ends_at) where status = 'published';
create index announcements_created_by_idx on public.announcements(created_by);
create index announcements_updated_by_idx on public.announcements(updated_by);
create trigger announcements_set_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

insert into public.admin_capabilities(key, resource, action, label)
values ('announcements.read', 'announcements', 'read', 'Read announcements'),
('announcements.manage', 'announcements', 'manage', 'Manage announcements');
-- Existing gallery editors receive the analogous notice permission.
insert into public.admin_role_grants(role_id, capability_key, scope)
select role_id, 'announcements.read', 'all' from public.admin_role_grants where capability_key = 'gallery.read'
on conflict do nothing;
insert into public.admin_role_grants(role_id, capability_key, scope)
select role_id, 'announcements.manage', 'all' from public.admin_role_grants where capability_key = 'gallery.update'
on conflict do nothing;

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
create policy announcements_public_read on public.announcements for select to anon, authenticated
using (status = 'published' and starts_at <= now());
create policy announcements_admin_read on public.announcements for select to authenticated
using ((select public.has_admin_capability(auth.uid(), 'announcements.read')) or (select public.has_admin_capability(auth.uid(), 'announcements.manage')));
create policy announcements_admin_insert on public.announcements for insert to authenticated
with check ((select public.has_admin_capability(auth.uid(), 'announcements.manage')));
create policy announcements_admin_update on public.announcements for update to authenticated
using ((select public.has_admin_capability(auth.uid(), 'announcements.manage')))
with check ((select public.has_admin_capability(auth.uid(), 'announcements.manage')));
create policy announcements_admin_delete on public.announcements for delete to authenticated
using ((select public.has_admin_capability(auth.uid(), 'announcements.manage')));

-- Database time is authoritative, including at exact schedule boundaries.
create function public.get_active_announcement() returns setof public.announcements
language sql stable security invoker set search_path = '' as $$
  select * from public.announcements
  where status = 'published' and starts_at <= now() and ends_at > now()
  order by starts_at desc, created_at desc, id desc limit 1;
$$;
revoke all on function public.get_active_announcement() from public;
grant execute on function public.get_active_announcement() to anon, authenticated, service_role;
