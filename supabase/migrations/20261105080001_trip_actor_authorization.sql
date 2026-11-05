-- Authorize the actor, never the historical creator. RLS still governs row access.
create or replace function public.enforce_unofficial_trip_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_limit integer;
  v_count integer;
begin
  -- Background imports/schedule sync have no end-user actor.
  if current_setting('role', true) = 'service_role'
    or (v_actor is null and session_user in ('postgres', 'supabase_admin')
      and current_setting('role', true) in ('none', 'postgres', 'supabase_admin')) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.starts_at, new.is_official, new.lifecycle_status, new.created_by)
      is not distinct from (old.starts_at, old.is_official, old.lifecycle_status, old.created_by) then
      return new;
    end if;
    if not public.can_manage_trip(old.id, v_actor) then
      raise exception 'Trip management permission required.';
    end if;
    -- Official permission is required to promote, not to maintain an existing trip.
    if new.is_official and not old.is_official
      and not public.has_admin_capability(v_actor, 'trips.official') then
      raise exception 'official trip permission required';
    end if;
    if new.is_official or public.has_trip_admin_capability(v_actor, 'trips.update', old.id) then
      return new;
    end if;
    -- Canceling/archiving does not consume an upcoming-trip slot.
    if new.lifecycle_status <> 'published' then return new; end if;
  else
    if v_actor is null or new.created_by is distinct from v_actor then
      raise exception 'Trip creator must be the current actor.';
    end if;
    if new.is_official then
      if not public.has_admin_capability(v_actor, 'trips.official') then
        raise exception 'official trip permission required';
      end if;
      return new;
    end if;
    if public.has_admin_capability(v_actor, 'trips.create') then return new; end if;
  end if;

  if not public.is_active_member(v_actor) or public.is_banned(v_actor)
    or exists (
      select 1 from public.membership_account_restrictions
      where user_id = v_actor and restriction in ('suspended', 'banned')
    ) then
    raise exception 'active unrestricted membership required';
  end if;
  if new.lifecycle_status <> 'published' or new.starts_at <= now() then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_actor::text, 11));
  select non_admin_upcoming_trip_limit into v_limit from public.club_admin_settings where id;
  select count(*) into v_count from public.trips
  where created_by = v_actor and not is_official
    and lifecycle_status = 'published' and starts_at > now()
    and (tg_op = 'INSERT' or id <> new.id);
  if v_count >= coalesce(v_limit, 2) then
    raise exception 'unofficial upcoming trip limit reached';
  end if;
  return new;
end;
$$;
