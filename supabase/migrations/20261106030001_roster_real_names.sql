-- Organizers see each registrant's first and last name instead of a Discord
-- username. Blank names stay null so the roster can leave them empty.
do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.get_registration_roster(uuid)'::regprocedure) into definition;
 marker:='''discord'',(select jsonb_build_object(''username'',nullif(i.identity_data->>''full_name'',''''),'
  || '''globalName'',nullif(i.identity_data->''custom_claims''->>''global_name'',''''))'
  || ' from auth.identities i where i.user_id=r.user_id and i.provider=''discord'''
  || ' order by i.updated_at desc nulls last limit 1),';
 if position(marker in definition)=0 then raise exception 'Roster Discord marker missing'; end if;
 definition:=replace(definition,marker,
  '''firstName'',nullif(btrim(p.first_name),''''),''lastName'',nullif(btrim(p.last_name),''''),');
 execute definition;
end $migration$;
