begin;
do $$
declare
  actor uuid := gen_random_uuid();
  applicant uuid := gen_random_uuid();
  v_role_id uuid := gen_random_uuid();
  expires timestamptz;
begin
  insert into auth.users(id,email,email_confirmed_at)
    select id,id::text || '@example.test',now() from unnest(array[actor,applicant]) id;
  insert into public.memberships(user_id,status,role) values(actor,'active','admin'),(applicant,'pending','regular');
  insert into public.membership_applications(user_id,full_name,contact_email,age_status,guardian_consent,dues_payment_claimed,dues_claimed_at,primary_interest)
    values(applicant,'Test applicant',applicant || '@example.test','adult','not_required',true,now(),'Hiking');
  insert into public.admin_roles(id,key,name) values(v_role_id,'payment_' || replace(v_role_id::text,'-','_'),'Payment regression');
  insert into public.admin_capabilities(key,resource,action,label,is_active)
    values('overview.read','overview','read','Overview',true),
      ('membership.confirm_payment','membership','confirm_payment','Review payments',true)
    on conflict(key) do update set is_active=true;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'overview.read','all');
  insert into public.admin_user_roles(user_id,role_id) values(actor,v_role_id);
  if has_function_privilege('authenticated','public.confirm_zelle_membership_application(uuid,uuid)','execute')
    or has_function_privilege('anon','public.confirm_zelle_membership_application(uuid,uuid)','execute') then
    raise exception 'Legacy payment RPC exposed outside service role';
  end if;
  perform set_config('request.jwt.claim.role','service_role',true);
  set local role service_role;
  begin
    perform public.confirm_zelle_membership_application(applicant,actor);
    raise exception 'Legacy officer role bypassed configured payment capability';
  exception when raise_exception then
    if sqlerrm <> 'payment review permission required' then raise; end if;
  end;
  reset role;
  -- Proper capability works even without a legacy officer membership role.
  update public.memberships set role='regular' where user_id=actor;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'membership.confirm_payment','all');
  set local role service_role;
  expires := public.confirm_zelle_membership_application(applicant,actor);
  reset role;
  if expires is null or expires <= now()
    or not exists(select 1 from public.memberships where user_id=applicant and status='active') then
    raise exception 'Authorized legacy payment reviewer could not activate membership';
  end if;
  insert into public.membership_account_restrictions(user_id,restriction,internal_reason,restricted_at)
    values(actor,'suspended','Regression suspension',now());
  set local role service_role;
  begin
    perform public.confirm_zelle_membership_application(applicant,actor);
    raise exception 'Suspended payment reviewer retained access';
  exception when raise_exception then
    if sqlerrm <> 'payment review permission required' then raise; end if;
  end;
  reset role;
end $$;
rollback;
