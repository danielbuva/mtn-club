begin;

create table registration_private.guardian_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.guardian_requests(id),
  kind text not null check (kind in ('receipt','signed','approved','rejected','clarification')),
  created_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  lease_id uuid,
  leased_until timestamptz,
  provider_id text,
  error_code text,
  finished_at timestamptz,
  record_token_hash text
);
alter table registration_private.guardian_notifications enable row level security;
create index guardian_notifications_due
  on registration_private.guardian_notifications(next_attempt_at,created_at)
  where finished_at is null;
create index guardian_notifications_receipts
  on registration_private.guardian_notifications(request_id,created_at desc) where kind='receipt';

create function registration_private.enqueue_guardian_signature()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into registration_private.guardian_notifications(request_id,kind)
  values(new.id,'receipt'),(new.id,'signed');
  return new;
end $$;
create trigger guardian_signature_notifications after update of status on public.guardian_requests
for each row when (old.status is distinct from new.status and new.status='signed')
execute function registration_private.enqueue_guardian_signature();

create function registration_private.enqueue_guardian_decision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into registration_private.guardian_notifications(request_id,kind)
  values(new.request_id,new.decision);
  return new;
end $$;
create trigger guardian_decision_notifications after insert on public.guardian_reviews
for each row when (new.basis='officer') execute function registration_private.enqueue_guardian_decision();

create function public.guardian_queue_record_copy()
returns boolean language plpgsql security definer set search_path='' as $$
declare v_request uuid; actor uuid:=auth.uid();
begin
  if actor is null or registration_private.blocked(actor) then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('registration-account:'||actor,0));
  select q.id into v_request from public.guardian_requests q
  where registration_private.owns_record(actor,q.participant_id) and q.status='signed'
  order by q.completed_at desc,q.id desc limit 1;
  if v_request is null then return false; end if;
  if exists(select 1 from registration_private.guardian_notifications n
    where n.request_id=v_request and n.kind='receipt'
      and (n.finished_at is null or n.created_at>now()-interval '10 minutes')) then
    return true;
  end if;
  insert into registration_private.guardian_notifications(request_id,kind) values(v_request,'receipt');
  return true;
end $$;

create function public.claim_guardian_notifications()
returns jsonb language plpgsql security definer set search_path='' as $$
declare jobs jsonb;
begin
  -- Stop before the provider's idempotency window expires.
  update registration_private.guardian_notifications
  set finished_at=now(),error_code='delivery_unknown',leased_until=null,lease_id=null
  where finished_at is null and attempts>0 and coalesce(leased_until,now())<=now()
    and (attempts>=6 or created_at<now()-interval '23 hours');

  with due as (
    select id from registration_private.guardian_notifications
    where finished_at is null and next_attempt_at<=now()
      and coalesce(leased_until,now())<=now()
    order by next_attempt_at,created_at,id
    limit 2 for update skip locked
  ), leased as (
    update registration_private.guardian_notifications n
    set attempts=n.attempts+1,lease_id=gen_random_uuid(),leased_until=now()+interval '2 minutes'
    from due where due.id=n.id
    returning n.id,n.lease_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'leaseId',lease_id)),'[]'::jsonb)
    into jobs from leased;
  return jobs;
end $$;

create function public.prepare_guardian_notification(p_id uuid,p_lease uuid,p_record_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n registration_private.guardian_notifications; q public.guardian_requests;
  c public.guardian_contacts; s public.registration_signatures; w public.registration_waivers;
  owner uuid; address text; participant text; outcome text;
begin
  select * into n from registration_private.guardian_notifications
    where id=p_id and lease_id=p_lease and leased_until>now() and finished_at is null for update;
  if not found then return null; end if;
  select * into q from public.guardian_requests where id=n.request_id;
  owner:=registration_private.guardian_account(q.participant_id);
  if exists(select 1 from auth.users u where u.id=owner and u.deleted_at is null) then
    select email into address from auth.users where id=owner;
  else
    return null;
  end if;
  select coalesce(nullif(trim(p.display_name),''),'The participant')
    into participant from public.profiles p where p.user_id=owner;
  if n.kind='receipt' then
    if p_record_hash is null or p_record_hash !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid guardian receipt token.';
    end if;
    if n.record_token_hash is not null and n.record_token_hash<>p_record_hash then
      -- Rotation during an uncertain provider send requires a new receipt job.
      return null;
    end if;
    select * into c from public.guardian_contacts where id=q.signed_contact_id;
    select * into s from public.registration_signatures where id=q.signature_id;
    select * into w from public.registration_waivers where id=q.waiver_id;
    address:=c.email;
    insert into public.guardian_request_tokens(token_hash,request_id,delivery,expires_at)
      values(p_record_hash,q.id,'record',greatest(
        coalesce(s.valid_until::timestamptz+interval '1 day',n.created_at+interval '1 year'),
        n.created_at+interval '30 days'))
      on conflict(token_hash) do nothing;
    update registration_private.guardian_notifications set record_token_hash=p_record_hash where id=n.id;
  end if;
  if address is null then return null; end if;
  -- Read only the automatic decision here. Officer decisions have their own jobs.
  outcome:=case when exists(select 1 from public.guardian_reviews r
    where r.request_id=q.id and r.basis='prior_verification' and r.decision='approved')
    then 'signed_accepted' else 'signed_review' end;
  return jsonb_build_object(
    'kind',case when n.kind='signed' then outcome else n.kind end,
    'to',address,'participantName',coalesce(participant,'The participant'),
    'guardianName',c.full_name,'membership',q.consent_id is not null,
    'waiver',q.signature_id is not null,'validUntil',s.valid_until,
    'waiverUntil',w.effective_until,'autoApproved',outcome='signed_accepted'
  );
end $$;

create function public.finish_guardian_notification(
  p_id uuid,p_lease uuid,p_provider_id text,p_error text,p_retry boolean
) returns void language sql security definer set search_path='' as $$
  update registration_private.guardian_notifications
  set provider_id=nullif(p_provider_id,''),error_code=nullif(p_error,''),
    next_attempt_at=now()+make_interval(mins=>least(60,2^attempts)::integer),
    finished_at=case when p_retry and attempts<6 then null else now() end,
    leased_until=null,lease_id=null
  where id=p_id and lease_id=p_lease and leased_until>now() and finished_at is null;
$$;

revoke all on function registration_private.enqueue_guardian_signature(),
  registration_private.enqueue_guardian_decision() from public,anon,authenticated,service_role;
revoke all on function public.guardian_queue_record_copy() from public,anon,service_role;
grant execute on function public.guardian_queue_record_copy() to authenticated;
revoke all on function public.claim_guardian_notifications(),
  public.prepare_guardian_notification(uuid,uuid,text),
  public.finish_guardian_notification(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_guardian_notifications(),
  public.prepare_guardian_notification(uuid,uuid,text),
  public.finish_guardian_notification(uuid,uuid,text,text,boolean) to service_role;

commit;
