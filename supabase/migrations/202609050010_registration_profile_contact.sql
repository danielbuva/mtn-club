-- Keep the reusable profile contact current while retaining each trip's snapshot.
create function registration_private.sync_profile_emergency_contact() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is distinct from new.user_id then return new; end if;
 if TG_OP='UPDATE' and old.emergency_contact is not distinct from new.emergency_contact then return new; end if;
 if coalesce(length(trim(new.emergency_contact->>'name')),0)>=2
 and coalesce(length(trim(new.emergency_contact->>'phone')),0)>=7
 and coalesce(length(trim(new.emergency_contact->>'relationship')),0)>=1 then
   insert into public.profile_private(user_id,emergency_contact)
   values(new.user_id,new.emergency_contact)
   on conflict(user_id) do update set emergency_contact=excluded.emergency_contact;
 end if;
 return new;
end $$;
revoke all on function registration_private.sync_profile_emergency_contact() from public,anon,authenticated,service_role;
create trigger registration_profile_contact after insert or update of emergency_contact
on public.registration_responses for each row execute function registration_private.sync_profile_emergency_contact();
-- Recover contacts already supplied in registration without overwriting a profile contact.
insert into public.profile_private(user_id,emergency_contact)
select distinct on (user_id) user_id,emergency_contact from public.registration_responses
where coalesce(length(trim(emergency_contact->>'name')),0)>=2
and coalesce(length(trim(emergency_contact->>'phone')),0)>=7
and coalesce(length(trim(emergency_contact->>'relationship')),0)>=1
order by user_id,updated_at desc
on conflict(user_id) do update set emergency_contact=excluded.emergency_contact
where coalesce(trim(profile_private.emergency_contact->>'name'),'')='';

-- Trip cards must reflect participation readiness without changing capacity/RSVP state.
do $$ declare definition text; marker text := '''reservedCount'',reserved,''availability'',available,''state'',state'; begin
 select pg_get_functiondef('public.get_registration_summaries(uuid[])'::regprocedure) into definition;
 if position(marker in definition)=0 then raise exception 'Missing registration summary integration point'; end if;
 definition:=replace(definition,marker,marker||',''requirements'',case when auth.uid() is null then array[]::text[] else registration_private.requirements(t.id,auth.uid()) end');
 execute definition;
end $$;
