-- This synthetic identity owns imported trip history, but is not a member account.
-- Retain its referenced records and omit it from the account directory and its totals.
do $$ declare definition text; marker text := 'where ('; begin
 select pg_get_functiondef('public.admin_list_accounts(uuid,text,text,text,text,text,boolean,integer,integer)'::regprocedure) into definition;
 if position('select * from account_rows rows' in definition)=0 or position(marker in definition)=0 then
 raise exception 'Missing account-directory filter integration point'; end if;
 definition:=replace(definition,marker,
 'where rows.user_id <> ''b2200767-eb8d-422a-beb5-1c5b738b24a5''::uuid and (');
 execute definition;
end $$;
