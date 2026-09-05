-- Assign ordinary creators atomically without granting permission to select leaders.
create or replace function public.assign_community_trip_creator_leader()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_official
    and new.created_by is not null
    and not public.has_admin_capability(new.created_by, 'trips.update') then
    insert into public.trip_leaders (trip_id, user_id)
    values (new.id, new.created_by)
    on conflict (trip_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_community_trip_creator_leader() from public, anon, authenticated;

create trigger trips_assign_community_creator_leader
after insert on public.trips
for each row execute function public.assign_community_trip_creator_leader();
