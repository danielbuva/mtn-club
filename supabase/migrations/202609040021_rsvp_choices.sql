-- Maybe and Not going are responses, never seat reservations or public Going attendance.
alter table public.trip_rsvps drop constraint trip_rsvps_registration_state_check;
alter table public.trip_rsvps add constraint trip_rsvps_registration_state_check check
 (registration_state in ('none','maybe','incomplete','confirmed','waitlisted','offered','cancelled','removed_by_organizer','legacy_review'));

do $migration$
declare definition text; original text;
begin
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 original:=definition;
 definition:=replace(definition,
   'if p_command in (''register'',''issue_offer'',''begin_signup'',''save_draft'') then',
   'if p_command in (''register'',''issue_offer'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'') then');
 definition:=replace(definition,
   'if p_command in (''begin_signup'',''save_draft'') then',
   'if p_command in (''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'') then');
 definition:=replace(definition,
   'not in (''none'',''cancelled'',''incomplete'')',
   'not in (''none'',''maybe'',''cancelled'',''incomplete'')');
 definition:=replace(definition,
   'when ''begin_signup'',''save_draft'' then next_state:=''incomplete'';',
   'when ''begin_signup'',''save_draft'' then next_state:=''incomplete'';
    when ''set_maybe'' then next_state:=''maybe'';
    when ''set_not_going'' then next_state:=''cancelled'';');
 if definition=original or position('when ''set_maybe''' in definition)=0 then
   raise exception 'Expected incomplete signup command rules missing';
 end if;
 execute definition;
 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 definition:=replace(definition,
   'state in (''none'',''cancelled'',''incomplete'')',
   'state in (''none'',''maybe'',''cancelled'',''incomplete'')');
 definition:=replace(definition,
   'array[''register'',''begin_signup'',''save_draft'']',
   'array[''register'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'']');
 execute definition;
 -- Preserve a tentative response when merging an account that has not responded.
 select pg_get_functiondef('public.merge_trip_registrations(uuid,uuid)'::regprocedure) into definition;
 definition:=replace(definition,
   '''removed_by_organizer'',''cancelled'',''none''',
   '''removed_by_organizer'',''incomplete'',''maybe'',''cancelled'',''none''');
 execute definition;
end $migration$;
