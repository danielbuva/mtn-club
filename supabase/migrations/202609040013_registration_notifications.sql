create function public.registration_maintenance() returns void
language plpgsql security definer set search_path = '' as $$
declare t record; r record; eid uuid; key text; begin
 update public.registration_worker_health set last_run_at=now() where id;
 for t in select id,starts_at,lifecycle_status from public.trips where exists(select 1 from public.registration_offers
   where trip_id=trips.id and status='pending' and expires_at<=now()) or
   (starts_at>now() and starts_at<=now()+interval '24 hours' and lifecycle_status='published') order by id for update loop
   perform registration_private.expire_offers(t.id);
   if t.lifecycle_status='published' and t.starts_at>now() and t.starts_at<=now()+interval '24 hours' then
    for r in select user_id from public.trip_rsvps where trip_id=t.id and registration_state='confirmed' loop
     key:='reminder:'||t.id||':'||r.user_id||':'||t.starts_at;
     if not exists(select 1 from public.registration_notifications where dedupe_key=key) then
       insert into public.registration_events(trip_id,user_id,kind,details)
       values(t.id,r.user_id,'reminder',jsonb_build_object('startAt',t.starts_at)) returning id into eid;
       insert into public.registration_notifications(event_id,trip_id,user_id,kind,dedupe_key)
       values(eid,t.id,r.user_id,'reminder',key) on conflict(dedupe_key) do nothing;
     end if;
    end loop;
   end if;
 end loop;
end $$;
create function public.claim_registration_notifications(p_limit integer default 10) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; begin
 update public.registration_notifications set status='failed',error_code='delivery_unknown',updated_at=now()
 where status in ('pending','sending') and attempts>0 and created_at<now()-interval '23 hours';
 update public.registration_notifications set status='failed',error_code='delivery_unknown',updated_at=now(),leased_until=null
 where status='sending' and attempts>=6 and leased_until<now();
 with candidates as (select id from public.registration_notifications
   where (status='pending' and next_attempt_at<=now() or status='sending' and leased_until<now())
   and attempts<6 order by created_at for update skip locked limit least(greatest(p_limit,1),20)),
 claimed as (update public.registration_notifications n set status='sending',attempts=attempts+1,
   leased_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),updated_at=now()
   from candidates c where n.id=c.id returning n.id,n.lease_token,n.attempts)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'leaseToken',lease_token,'attempts',attempts)),'[]') into result from claimed;
 return result;
end $$;
create function public.prepare_registration_notification(p_id uuid,p_lease uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n public.registration_notifications; t public.trips; e public.registration_events; address text; state text; begin
 select * into n from public.registration_notifications where id=p_id for update;
 if n.status<>'sending' or n.lease_token is distinct from p_lease or n.leased_until<=now() then return null; end if;
 select * into t from public.trips where id=n.trip_id;
 select * into e from public.registration_events where id=n.event_id;
 select registration_state into state from public.trip_rsvps where trip_id=n.trip_id and user_id=n.user_id;
 if not registration_private.email_enabled(n.user_id,n.kind) then
   update public.registration_notifications set status='suppressed',error_code='email_opt_out',updated_at=now() where id=p_id; return null;
 end if;
 if (n.kind='offered' and not exists(select 1 from public.registration_offers where id=(e.details->>'offerId')::uuid
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
create function public.finish_registration_notification(p_id uuid,p_lease uuid,p_provider_id text,p_error text,p_retry boolean)
returns void language plpgsql security definer set search_path = '' as $$ begin
 p_provider_id:=nullif(p_provider_id,'');
 p_error:=nullif(p_error,'');
 update public.registration_notifications set
   status=case when p_provider_id is not null then 'sent' when p_retry and attempts<6 then 'pending' else 'failed' end,
   provider_id=p_provider_id,error_code=left(p_error,100),updated_at=now(),leased_until=null,
   next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer))
 where id=p_id and lease_token=p_lease and status='sending';
end $$;
create function public.registration_worker_result(p_error text default null) returns void
language sql security definer set search_path = '' as $$
 update public.registration_worker_health set last_error=left(p_error,100),
 last_success_at=case when p_error is null then now() else last_success_at end where id;
$$;
create function public.registration_delivery(p_event_id text,p_provider_id text,p_status text) returns void
language plpgsql security definer set search_path = '' as $$ begin
 if p_status not in ('delivered','bounced','failed') then return; end if;
 insert into public.registration_delivery_events(id) values(p_event_id) on conflict do nothing;
 if not found then return; end if;
 -- Provider acceptance may be followed by a webhook before the worker commits.
 update public.registration_notifications set status=p_status,updated_at=now()
 where provider_id=p_provider_id and (status in ('sending','sent') or status='delivered' and p_status in ('bounced','failed'));
end $$;
-- Keep unmatched delivery events so an early webhook is reconciled after acceptance.
alter table public.registration_delivery_events add column provider_id text, add column delivery_status text;
create or replace function public.registration_delivery(p_event_id text,p_provider_id text,p_status text) returns void
language plpgsql security definer set search_path = '' as $$ begin
 if p_status not in ('delivered','bounced','failed') then return; end if;
 insert into public.registration_delivery_events(id,provider_id,delivery_status) values(p_event_id,p_provider_id,p_status) on conflict do nothing;
 if not found then return; end if;
 update public.registration_notifications set status=p_status,updated_at=now()
 where provider_id=p_provider_id and (status in ('sending','sent') or status='delivered' and p_status in ('bounced','failed'));
end $$;
create function registration_private.reconcile_delivery() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.provider_id is not null and new.status='sent' then
  select delivery_status into new.status from public.registration_delivery_events where provider_id=new.provider_id
    order by case when delivery_status in ('bounced','failed') then 0 else 1 end,received_at desc limit 1;
  new.status:=coalesce(new.status,'sent');
 end if;
 return new;
end $$;
create trigger registration_reconcile_delivery before update on public.registration_notifications
for each row execute function registration_private.reconcile_delivery();

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in ('registration_maintenance','claim_registration_notifications',
    'prepare_registration_notification','finish_registration_notification','registration_worker_result','registration_delivery') loop
   execute format('revoke all on function %s from public,anon,authenticated',f.signature);
   execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
