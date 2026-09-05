-- Allow a participant to remove a Maybe or Not going response from the trip list.
do $migration$
declare
  definition text;
  original text;
begin
  select pg_get_functiondef(
    'public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure
  ) into definition;
  original := definition;

  definition := replace(
    definition,
    'if p_command in (''register'',''issue_offer'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'') then',
    'if p_command in (''register'',''issue_offer'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'',''clear_choice'') then'
  );
  definition := replace(
    definition,
    ' close_at:=coalesce(t.rsvp_deadline,t.starts_at);',
    ' close_at:=coalesce(t.rsvp_deadline,t.starts_at);'
      || E'\n if p_command=''clear_choice'' then'
      || E'\n   if target<>uid then raise exception ''Participants can only clear their own RSVP.''; end if;'
      || E'\n   if coalesce(r.registration_state,''none'') not in (''maybe'',''cancelled'') then raise exception ''No RSVP choice to clear.''; end if;'
      || E'\n end if;'
  );
  definition := replace(
    definition,
    'when ''begin_signup'',''save_draft'' then next_state:=''incomplete'';',
    'when ''begin_signup'',''save_draft'' then next_state:=''incomplete'';'
      || E'\n when ''clear_choice'' then next_state:=''none'';'
  );
  definition := replace(
    definition,
    'array[''register'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'']',
    'array[''register'',''begin_signup'',''save_draft'',''set_maybe'',''set_not_going'',''clear_choice'']'
  );

  if definition = original or position('when ''clear_choice''' in definition) = 0 then
    raise exception 'Expected RSVP choice command rules missing';
  end if;
  execute definition;
end $migration$;
