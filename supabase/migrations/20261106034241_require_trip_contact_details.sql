-- Keep contact answers in the existing private registration response/roster path.
create function registration_private.required_contact_questions(p_questions jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select '[{"id":"participant_email","label":"Your email address","type":"text","required":true},{"id":"participant_phone","label":"Your phone number","type":"text","required":true}]'::jsonb
 || coalesce((select jsonb_agg(q order by ordinal) from jsonb_array_elements(p_questions) with ordinality as items(q,ordinal)
 where q->>'id' not in ('participant_email','participant_phone')),'[]'::jsonb);
$$;
revoke all on function registration_private.required_contact_questions(jsonb) from public,anon,authenticated,service_role;

create function registration_private.enforce_contact_requirements() returns trigger
language plpgsql set search_path='' as $$
begin
 new.emergency_required:=true;
 new.questions:=registration_private.required_contact_questions(new.questions);
 perform registration_private.validate_questions(new.questions);
 return new;
end $$;
revoke all on function registration_private.enforce_contact_requirements() from public,anon,authenticated,service_role;
create trigger registration_required_contacts before insert or update on public.trip_registration_settings
for each row execute function registration_private.enforce_contact_requirements();
alter table public.trip_registration_settings alter column emergency_required set default true;

-- Preserve RSVP seats and historical responses, but require the current form on future submissions.
update public.trip_registration_settings
set emergency_required=true, questions=registration_private.required_contact_questions(questions),
 form_version=form_version+1, revision=revision+1;

-- This shared requirements check also protects offers and organizer readiness checks.
create or replace function registration_private.legacy_requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; r public.registration_responses; reasons text[] := '{}';
begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 select * into r from public.registration_responses where trip_id=p_trip and user_id=p_user;
 if r.form_version is distinct from s.form_version then reasons:=array_append(reasons,'Complete the current registration form.'); end if;
 if coalesce(length(trim(r.answers->>'participant_email')),0)>320
 or coalesce(trim(r.answers->>'participant_email'),'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  reasons:=array_append(reasons,'Enter a valid participant email address.');
 end if;
 if coalesce(length(r.answers->>'participant_phone'),0)>50
 or coalesce(length(regexp_replace(r.answers->>'participant_phone','[^0-9]','','g')),0) not between 10 and 15 then
  reasons:=array_append(reasons,'Enter a participant phone number with 10–15 digits.');
 end if;
 if coalesce(length(trim(r.emergency_contact->>'name')),0)<2
 or coalesce(length(regexp_replace(r.emergency_contact->>'phone','[^0-9]','','g')),0) not between 10 and 15
 or coalesce(length(trim(r.emergency_contact->>'relationship')),0)<1 then
  reasons:=array_append(reasons,'Confirm an emergency contact name, relationship, and phone number.');
 end if;
 if s.waiver_required and not registration_private.waiver_complete(p_trip,p_user) then
  reasons:=array_append(reasons,'Read and sign the required waiver.');
 end if;
 return reasons;
end $$;
