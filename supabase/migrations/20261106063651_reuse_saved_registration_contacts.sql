-- Reuse contact details without exposing private profile or signature data through a new public RPC.
create function registration_private.valid_contact_email(value text) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(length(trim(value)) between 3 and 320 and trim(value) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$',false);
$$;
create function registration_private.valid_contact_phone(value text) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(length(value)<=50 and length(regexp_replace(value,'[^0-9]','','g')) between 10 and 15,false);
$$;
create function registration_private.valid_emergency_contact(value jsonb) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(length(trim(value->>'name'))>=2 and length(trim(value->>'relationship'))>=1
 and registration_private.valid_contact_phone(value->>'phone'),false);
$$;

create function registration_private.saved_contact_answers(p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object(
 'participant_email',(
  select trim(value) from (
   select email as value,0 as priority,created_at as saved_at from auth.users where id=p_user
   union all select contact_email,1,created_at from public.membership_applications where user_id=p_user
   union all select answers->>'participant_email',2,updated_at from public.registration_responses where user_id=p_user
  ) candidates where registration_private.valid_contact_email(value) order by priority,saved_at desc limit 1),
 'participant_phone',(
  select trim(value) from (
   select phone as value,0 as priority,null::timestamptz as saved_at from public.profile_private where user_id=p_user
   union all select phone,1,created_at from auth.users where id=p_user
   union all select signer_details->>'phone',2,signed_at from public.registration_signatures
     where user_id=p_user and signer_kind='adult'
   union all select answers->>'participant_phone',3,updated_at from public.registration_responses where user_id=p_user
  ) candidates where registration_private.valid_contact_phone(value) order by priority,saved_at desc limit 1)));
$$;
create function registration_private.contact_answers(p_trip uuid,p_user uuid,p_answers jsonb) returns jsonb
language sql stable security definer set search_path='' as $$
 -- Explicit nonempty entries take precedence, so malformed user input is still rejected.
 select registration_private.saved_contact_answers(p_user) || coalesce(p_answers,'{}'::jsonb);
$$;
create function registration_private.emergency_contact(p_trip uuid,p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select value from (
  select emergency_contact as value,0 as priority,updated_at as saved_at from public.registration_responses where trip_id=p_trip and user_id=p_user
  union all select emergency_contact,1,null::timestamptz from public.profile_private where user_id=p_user
  union all select signer_details->'emergencyContact',2,signed_at from public.registration_signatures where user_id=p_user and signer_kind='adult'
  union all select emergency_contact,3,updated_at from public.registration_responses where user_id=p_user
 ) candidates where registration_private.valid_emergency_contact(value) order by priority,saved_at desc limit 1),'{}'::jsonb);
$$;
revoke all on function registration_private.valid_contact_email(text),registration_private.valid_contact_phone(text),
 registration_private.valid_emergency_contact(jsonb),registration_private.saved_contact_answers(uuid),
 registration_private.contact_answers(uuid,uuid,jsonb),registration_private.emergency_contact(uuid,uuid)
 from public,anon,authenticated,service_role;

-- Repair only responses exactly one version behind the contact-only change, with no custom
-- questions to re-answer. Do not upgrade older incomplete forms or alter signature evidence.
update public.registration_responses r set form_version=s.form_version
from public.trip_registration_settings s
where s.trip_id=r.trip_id and r.form_version=s.form_version-1
 and not exists(select 1 from jsonb_array_elements(s.questions) q where q->>'id' not in ('participant_email','participant_phone'));

create or replace function registration_private.legacy_requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; r public.registration_responses; answers jsonb; contact jsonb; reasons text[] := '{}';
begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 select * into r from public.registration_responses where trip_id=p_trip and user_id=p_user;
 answers:=registration_private.contact_answers(p_trip,p_user,r.answers);
 contact:=registration_private.emergency_contact(p_trip,p_user);
 if r.form_version is distinct from s.form_version then reasons:=array_append(reasons,'Complete the current registration form.'); end if;
 if not registration_private.valid_contact_email(answers->>'participant_email') then
  reasons:=array_append(reasons,'Enter a valid participant email address.'); end if;
 if not registration_private.valid_contact_phone(answers->>'participant_phone') then
  reasons:=array_append(reasons,'Enter a participant phone number with 10–15 digits.'); end if;
 if not registration_private.valid_emergency_contact(contact) then
  reasons:=array_append(reasons,'Confirm an emergency contact name, relationship, and phone number.'); end if;
 if s.waiver_required and not registration_private.waiver_complete(p_trip,p_user) then
  reasons:=array_append(reasons,'Read and sign the required waiver.'); end if;
 return reasons;
end $$;

-- Keep the existing RPC's access checks and transaction/idempotency logic intact.
do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 marker:='''questions'',s.questions';
 if position(marker in definition)=0 then raise exception 'Missing snapshot questions'; end if;
 definition:=replace(definition,marker,$patch$'questions',coalesce((select jsonb_agg(q order by ordinal)
 from jsonb_array_elements(s.questions) with ordinality as items(q,ordinal)
 where not (q->>'id'='participant_email' and registration_private.valid_contact_email(registration_private.contact_answers(p_trip_id,uid,(select answers from public.registration_responses where trip_id=p_trip_id and user_id=uid))->>'participant_email'))
 and not (q->>'id'='participant_phone' and registration_private.valid_contact_phone(registration_private.contact_answers(p_trip_id,uid,(select answers from public.registration_responses where trip_id=p_trip_id and user_id=uid))->>'participant_phone'))),'[]'::jsonb)$patch$);
 marker:='''answers'',coalesce((select answers from public.registration_responses where trip_id=p_trip_id and user_id=uid),''{}'')';
 if position(marker in definition)=0 then raise exception 'Missing snapshot answers'; end if;
 definition:=replace(definition,marker,$patch$'answers',registration_private.contact_answers(p_trip_id,uid,(select answers from public.registration_responses where trip_id=p_trip_id and user_id=uid))$patch$);
 marker:='''emergencyContact'',coalesce((select emergency_contact from public.registration_responses where trip_id=p_trip_id and user_id=uid),
    (select emergency_contact from public.profile_private where user_id=uid),''{}'')';
 if position(marker in definition)=0 then raise exception 'Missing snapshot emergency contact'; end if;
 definition:=replace(definition,marker,'''emergencyContact'',registration_private.emergency_contact(p_trip_id,uid),''emergencyOnFile'',registration_private.valid_emergency_contact(registration_private.emergency_contact(p_trip_id,uid))');
 execute definition;

 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker:='perform registration_private.validate_answers(s.questions,answers);';
 if position(marker in definition)=0 then raise exception 'Missing command answer validation'; end if;
 definition:=replace(definition,marker,$patch$
     answers:=registration_private.contact_answers(p_trip_id,target,answers);
     perform registration_private.validate_answers(s.questions,answers);$patch$);
 -- Resolve omitted emergency details from the same sources used by snapshots and readiness.
 marker:='contact:=coalesce(p_data->''emergencyContact'',(select x.emergency_contact from public.registration_responses x where x.trip_id=p_trip_id and x.user_id=target),''{}'');';
 if position(marker in definition)=0 then raise exception 'Missing command contact lookup'; end if;
 definition:=replace(definition,marker,'contact:=coalesce(p_data->''emergencyContact'',registration_private.emergency_contact(p_trip_id,target));');
 marker:='if jsonb_typeof(contact)<>''object''';
 if position(marker in definition)=0 then raise exception 'Missing command contact validation'; end if;
 definition:=replace(definition,marker,$patch$if p_command in ('register','update_response') and not registration_private.valid_emergency_contact(contact) then
   raise exception 'Confirm an emergency contact name, relationship, and phone number.'; end if;
   if jsonb_typeof(contact)<>'object'$patch$);
 execute definition;
end $migration$;
