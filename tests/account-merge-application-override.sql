begin;
-- Primary has no application; secondary holds a confirmed complimentary one.
do $$
declare
  actor uuid:=gen_random_uuid(); primary_id uuid:=gen_random_uuid(); secondary_id uuid:=gen_random_uuid();
  role_id uuid; override_id uuid:=gen_random_uuid();
begin
  insert into auth.users(id,email,email_confirmed_at) values(actor,actor||'@example.test',now()),
    (primary_id,primary_id||'@example.test',now()),(secondary_id,secondary_id||'@example.test',now());
  select id into strict role_id from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id,role_id) values(actor,role_id);
  perform set_config('request.jwt.claim.sub',actor::text,true);
  perform set_config('request.jwt.claim.role','service_role',true);
  insert into public.profiles(user_id,display_name) values(primary_id,'Retained'),(secondary_id,'Source');
  insert into public.membership_access_overrides(id,user_id,reason,granted_by)
    values(override_id,secondary_id,'Complimentary officer access',actor);
  insert into public.membership_applications(user_id,full_name,contact_email,age_status,guardian_consent,
      primary_interest,status,confirmed_at,confirmed_by,membership_access_override_id)
    values(secondary_id,'Source Member',secondary_id||'@example.test','adult','not_required','Hiking',
      'confirmed',now(),actor,override_id);
  perform public.merge_accounts(actor,primary_id,secondary_id,false);
  if not exists(select 1 from public.membership_applications
      where user_id=primary_id and membership_access_override_id=override_id and status='confirmed') then
    raise exception 'Retained application lost its complimentary override';
  end if;
  if exists(select 1 from public.membership_applications where user_id=secondary_id) then
    raise exception 'Source application survived the merge';
  end if;
end $$;
rollback;
