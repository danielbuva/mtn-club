-- Reference catalogs from 202609020001; no accounts or role assignments.
insert into public.admin_roles (key, name, description, is_super_admin, is_system)
values
  ('super_admin', 'Super Admin', 'Protected identity and authorization access.', true, true),
  ('president', 'President', 'Club president.', false, true),
  ('community_director', 'Community Director', 'Community and communications leadership.', false, true),
  ('gear_manager', 'Gear Manager', 'Gear and equipment leadership.', false, true),
  ('treasurer', 'Treasurer', 'Membership dues and financial operations.', false, true),
  ('scheduling_liaison', 'Scheduling Liaison', 'Trip and calendar scheduling.', false, true),
  ('trip_leader', 'Trip Leader', 'Trip planning and leadership.', false, true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  is_super_admin = excluded.is_super_admin,
  is_system = excluded.is_system;

insert into public.admin_capabilities
  (key, resource, action, label, supports_assigned_scope, is_active, phase)
values
  ('overview.read', 'overview', 'read', 'View overview', false, true, 1),
  ('trips.read', 'trips', 'read', 'View trips', true, true, 1),
  ('trips.create', 'trips', 'create', 'Create trips', false, true, 1),
  ('trips.update', 'trips', 'update', 'Edit trips', true, true, 1),
  ('trips.delete', 'trips', 'delete', 'Cancel and archive trips', true, true, 1),
  ('trips.official', 'trips', 'official', 'Set official status', true, true, 1),
  ('membership.read', 'membership', 'read', 'View membership', false, true, 1),
  ('membership.update', 'membership', 'update', 'Manage membership', false, true, 1),
  ('membership.confirm_payment', 'membership', 'confirm_payment', 'Review Zelle payments', false, true, 1),
  ('membership.confirm_guardian', 'membership', 'confirm_guardian', 'Confirm guardian consent', false, true, 1),
  ('accounts.read', 'accounts', 'read', 'View accounts', false, true, 1),
  ('accounts.update', 'accounts', 'update', 'Manage accounts', false, true, 1),
  ('analytics.read', 'analytics', 'read', 'View analytics', false, true, 1),
  ('mailing_list.read', 'mailing_list', 'read', 'View mailing list', false, true, 1),
  ('mailing_list.export', 'mailing_list', 'export', 'Export mailing list', false, true, 1),
  ('gallery.read', 'gallery', 'read', 'View gallery admin', false, true, 1),
  ('gallery.create', 'gallery', 'create', 'Upload gallery photos', false, true, 1),
  ('gallery.update', 'gallery', 'update', 'Edit gallery photos', false, true, 1),
  ('gallery.delete', 'gallery', 'delete', 'Delete gallery photos', false, true, 1),
  ('leadership.read', 'leadership', 'read', 'View leadership', false, true, 1),
  ('settings.read', 'settings', 'read', 'View settings', false, true, 1),
  ('settings.update', 'settings', 'update', 'Edit settings', false, true, 1),
  ('rsvps.read', 'rsvps', 'read', 'View RSVPs', true, false, 2),
  ('rsvps.update', 'rsvps', 'update', 'Manage RSVPs', true, false, 2),
  ('carpools.read', 'carpools', 'read', 'View carpools', true, false, 2),
  ('carpools.update', 'carpools', 'update', 'Manage carpools', true, false, 2),
  ('attendance.update', 'attendance', 'update', 'Manage attendance', true, false, 2),
  ('announcements.update', 'announcements', 'update', 'Manage announcements', false, false, 2),
  ('gear.update', 'gear', 'update', 'Manage gear closet', false, false, 2)
on conflict (key) do update set
  resource = excluded.resource,
  action = excluded.action,
  label = excluded.label,
  supports_assigned_scope = excluded.supports_assigned_scope,
  is_active = excluded.is_active,
  phase = excluded.phase;

insert into public.admin_role_grants (role_id, capability_key, scope)
select roles.id, capabilities.key, 'all'::public.admin_permission_scope
from public.admin_roles roles
cross join public.admin_capabilities capabilities
where roles.key <> 'super_admin'
  and capabilities.phase = 1
  and capabilities.is_active
on conflict (role_id, capability_key) do nothing;


insert into public.club_admin_settings (id) values (true) on conflict (id) do nothing;
