begin;

alter table public.trip_tag_options enable row level security;

grant select, insert, update, delete on table public.trip_tag_options to authenticated;

revoke all on table public.trip_tag_options from anon;

drop policy if exists trip_tag_options_select_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_insert_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_update_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_delete_staff_plus on public.trip_tag_options;

create policy trip_tag_options_select_staff_plus
on public.trip_tag_options
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('staff', 'leadership', 'admin')
  )
);

create policy trip_tag_options_insert_staff_plus
on public.trip_tag_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('staff', 'leadership', 'admin')
  )
);

create policy trip_tag_options_update_staff_plus
on public.trip_tag_options
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('staff', 'leadership', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('staff', 'leadership', 'admin')
  )
);

create policy trip_tag_options_delete_staff_plus
on public.trip_tag_options
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('staff', 'leadership', 'admin')
  )
);

commit;;
