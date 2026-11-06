-- Members can see who is going on a trip, limited to confirmed attendees who
-- opted in to the attendee list and have not hidden their profile. Organizers
-- get each registrant's linked Discord account in the roster.
do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;

 marker:='''attendees'',case when manager or state=''confirmed'' then';
 if position(marker in definition)=0 then raise exception 'Attendee visibility marker missing'; end if;
 definition:=replace(definition,marker,
  '''attendeesVisible'',manager or state=''confirmed'' or (uid is not null and public.is_active_member(uid)),'
  || '''attendees'',case when manager or state=''confirmed'' or (uid is not null and public.is_active_member(uid)) then');

 marker:='''avatarUrl'',p.avatar_url))';
 if position(marker in definition)=0 then raise exception 'Attendee order marker missing'; end if;
 definition:=replace(definition,marker,
  '''avatarUrl'',p.avatar_url) order by lower(coalesce(p.display_name,''Participant'')),a.user_id)');
 execute definition;

 select pg_get_functiondef('public.get_registration_roster(uuid)'::regprocedure) into definition;
 marker:='''revision'',r.revision,''registeredAt'',r.registered_at,';
 if position(marker in definition)=0 then raise exception 'Roster row marker missing'; end if;
 definition:=replace(definition,marker,
  '''avatarUrl'',p.avatar_url,'
  || '''showInAttendeeList'',coalesce(a.show_in_attendee_list,false),'
  || '''discord'',(select jsonb_build_object(''username'',nullif(i.identity_data->>''full_name'',''''),'
  || '''globalName'',nullif(i.identity_data->''custom_claims''->>''global_name'',''''))'
  || ' from auth.identities i where i.user_id=r.user_id and i.provider=''discord'''
  || ' order by i.updated_at desc nulls last limit 1),'
  || marker);
 execute definition;
end $migration$;
