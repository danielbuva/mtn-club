-- Explicit per-trip consent, independent of the general announcement subscription.
create table public.trip_update_followers (
 trip_id uuid not null references public.trips(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(trip_id,user_id)
);
create index trip_update_followers_user on public.trip_update_followers(user_id);
alter table public.trip_update_followers enable row level security;
revoke all on public.trip_update_followers from public,anon,authenticated,service_role;
grant select on public.trip_update_followers to authenticated;
create policy trip_update_followers_read_self on public.trip_update_followers
 for select to authenticated using(user_id=(select auth.uid()));

create function public.set_trip_update_following(p_trip_id uuid,p_following boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); begin
 if uid is null then raise exception 'Sign in to follow trip updates.'; end if;
 if p_following is null then raise exception 'Choose whether to follow this trip.'; end if;
 if not p_following then
  delete from public.trip_update_followers where trip_id=p_trip_id and user_id=uid;
  return false;
 end if;
 if registration_private.blocked(uid) or not public.can_view_trip(p_trip_id,uid)
 or not exists(select 1 from public.trips where id=p_trip_id and lifecycle_status='published' and starts_at>now()) then
  raise exception 'This trip is not available to follow.';
 end if;
 if not (registration_private.email_preferences(uid)->>'email')::boolean then
  raise exception 'Turn on Allow club emails in Privacy settings before following.';
 end if;
 insert into public.trip_update_followers(trip_id,user_id) values(p_trip_id,uid) on conflict do nothing;
 return true;
end $$;
revoke all on function public.set_trip_update_following(uuid,boolean) from public,anon;
grant execute on function public.set_trip_update_following(uuid,boolean) to authenticated;

-- Called only by trusted queue code; recipients must retain access and consent.
create function registration_private.open_email_enabled(p_trip uuid,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select not registration_private.blocked(p_user) and public.can_view_trip(p_trip,p_user)
 and (p->>'email')::boolean and (
  exists(select 1 from public.trip_update_followers where trip_id=p_trip and user_id=p_user)
  or (p->>'announcements')::boolean)
 from (select registration_private.email_preferences(p_user) p) settings;
$$;
revoke all on function registration_private.open_email_enabled(uuid,uuid) from public,anon,authenticated,service_role;

create function registration_private.queue_registration_open(p_trip uuid) returns void
language plpgsql security definer set search_path='' as $$
declare eid uuid; begin
 insert into public.registration_events(trip_id,actor_id,kind,created_at)
 values(p_trip,auth.uid(),'registration_opened',clock_timestamp()) returning id into eid;
 insert into public.registration_notifications(event_id,trip_id,user_id,kind,dedupe_key)
 select eid,p_trip,c.user_id,'registration_opened',eid||':'||c.user_id
 from (
  select user_id from public.trip_update_followers where trip_id=p_trip
  union select user_id from public.mailing_list_subscriptions where subscribed
 ) c where registration_private.open_email_enabled(p_trip,c.user_id);
end $$;
revoke all on function registration_private.queue_registration_open(uuid) from public,anon,authenticated,service_role;

-- A transition is the registration gate opening, not a seat becoming available.
-- No backfill: trips already open at deployment never create an announcement.
create function registration_private.registration_open_transition() returns trigger
language plpgsql security definer set search_path='' as $$
declare t public.trips; enabled boolean; global_enabled boolean; was_open boolean; is_open boolean; begin
 select registration_enabled into global_enabled from public.club_admin_settings where id;
 if tg_table_name='club_admin_settings' then
  if not old.registration_enabled and new.registration_enabled then
   for t in select trips.* from public.trips trips join public.trip_registration_settings s on s.trip_id=trips.id
    where s.enabled and trips.lifecycle_status='published' and least(trips.starts_at,coalesce(trips.rsvp_deadline,trips.starts_at))>now() loop
    perform registration_private.queue_registration_open(t.id);
   end loop;
  end if;
  return new;
 end if;
 if tg_table_name='trip_registration_settings' then
  select * into t from public.trips where id=new.trip_id;
  was_open:=old.enabled; is_open:=new.enabled;
  if not was_open and is_open and global_enabled and t.lifecycle_status='published'
   and least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))>now() then
   perform registration_private.queue_registration_open(t.id);
  end if;
 else
  select s.enabled into enabled from public.trip_registration_settings s where s.trip_id=new.id;
  was_open:=old.lifecycle_status='published' and least(old.starts_at,coalesce(old.rsvp_deadline,old.starts_at))>now();
  is_open:=new.lifecycle_status='published' and least(new.starts_at,coalesce(new.rsvp_deadline,new.starts_at))>now();
  if not was_open and is_open and enabled and global_enabled then
   perform registration_private.queue_registration_open(new.id);
  end if;
 end if;
 return new;
end $$;
revoke all on function registration_private.registration_open_transition() from public,anon,authenticated,service_role;
create trigger registration_open_settings after update of enabled on public.trip_registration_settings
 for each row execute function registration_private.registration_open_transition();
create trigger registration_open_trip after update of lifecycle_status,starts_at,rsvp_deadline on public.trips
 for each row execute function registration_private.registration_open_transition();
create trigger registration_open_global after update of registration_enabled on public.club_admin_settings
 for each row execute function registration_private.registration_open_transition();

create or replace function public.prepare_registration_notification(p_id uuid,p_lease uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n public.registration_notifications; t public.trips; e public.registration_events; address text; state text; begin
 select * into n from public.registration_notifications where id=p_id for update;
 if n.status<>'sending' or n.lease_token is distinct from p_lease or n.leased_until<=now() then return null; end if;
 select * into t from public.trips where id=n.trip_id;
 select * into e from public.registration_events where id=n.event_id;
 select registration_state into state from public.trip_rsvps where trip_id=n.trip_id and user_id=n.user_id;
 if (n.kind='registration_opened' and not registration_private.open_email_enabled(n.trip_id,n.user_id))
 or (n.kind<>'registration_opened' and not registration_private.email_enabled(n.user_id,n.kind)) then
   update public.registration_notifications set status='suppressed',error_code='email_opt_out',updated_at=now() where id=p_id; return null;
 end if;
 if (n.kind='registration_opened' and (t.lifecycle_status<>'published'
     or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()
     or not coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
     or not coalesce((select registration_enabled from public.club_admin_settings where id),false)
     or exists(select 1 from public.registration_events newer where newer.trip_id=t.id
       and newer.kind='registration_opened' and newer.created_at>e.created_at)))
   or (n.kind='offered' and not exists(select 1 from public.registration_offers where id=(e.details->>'offerId')::uuid
      and status='pending' and expires_at>now()))
   or (n.kind in ('confirmed','reminder') and (state is distinct from 'confirmed' or t.lifecycle_status<>'published'))
   or (n.kind='waitlisted' and state is distinct from 'waitlisted')
   or (n.kind='offer_expired' and state is distinct from 'waitlisted')
   or (n.kind='reminder' and (t.starts_at<=now() or (e.details->>'startAt')::timestamptz is distinct from t.starts_at))
   or (n.kind='trip_changed' and t.lifecycle_status<>'published') then
   update public.registration_notifications set status='obsolete',updated_at=now() where id=p_id; return null;
 end if;
 select email into address from auth.users where id=n.user_id;
 if address is null then
   update public.registration_notifications set status='failed',error_code='no_email',updated_at=now() where id=p_id; return null;
 end if;
 return jsonb_build_object('id',n.id,'tripId',t.id,'title',t.title,'kind',n.kind,'email',address,
   'startAt',t.starts_at,'timeZone',t.time_zone,
   'offerExpiresAt',(select expires_at from public.registration_offers where id=(e.details->>'offerId')::uuid));
end $$;
