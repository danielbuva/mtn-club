-- Reconcile approved bootstrap accounts that may have signed up after a
-- schema-only environment was initialized.
with super_role as (
  select id
  from public.admin_roles
  where key = 'super_admin' and is_super_admin
), inserted as (
  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  select users.id, super_role.id, users.id
  from auth.users users
  cross join super_role
  where lower(users.email) in (
    'valded5@unlv.nevada.edu',
    'welcometochilis666@aol.com'
  )
  on conflict (user_id, role_id) do nothing
  returning user_id, role_id
)
insert into public.admin_activity_events (
  actor_user_id,
  subject_user_id,
  action,
  resource_type,
  resource_id,
  summary,
  after_data
)
select
  inserted.user_id,
  inserted.user_id,
  'super_admin_bootstrapped',
  'admin_user_role',
  inserted.role_id::text,
  'Approved bootstrap account received super-admin access.',
  jsonb_build_object('role_id', inserted.role_id)
from inserted;
