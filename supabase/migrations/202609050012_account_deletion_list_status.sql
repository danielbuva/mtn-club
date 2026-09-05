-- Keep completed deletion status visible, but exclude it from the cleanup queue.
do $$ declare definition text; marker text := 'and deletion_jobs.status in (''pending'', ''auth_deleted'', ''failed'')'; begin
 select pg_get_functiondef('public.admin_list_accounts(uuid,text,text,text,text,text,boolean,integer,integer)'::regprocedure) into definition;
 if position(marker in definition)=0 or position('rows.deletion_status is not null' in definition)=0 then
 raise exception 'Missing account deletion status integration point'; end if;
 definition:=replace(definition,marker,'');
 definition:=replace(definition,'rows.deletion_status is not null','rows.deletion_status in (''pending'', ''auth_deleted'', ''failed'')');
 execute definition;
end $$;
