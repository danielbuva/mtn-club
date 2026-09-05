-- Apply to the verified project AFTER setting these two Supabase Vault secrets:
-- registration_worker_url = https://<environment>/api/internal/registration/process
-- registration_worker_secret = the environment's REGISTRATION_WORKER_SECRET.
-- Optional Vault secret registration_vercel_bypass holds existing preview automation access.
-- No secrets are printed or stored in the job command.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='registration_worker_url' and decrypted_secret ~ '^https://')
 or not exists(select 1 from vault.decrypted_secrets where name='registration_worker_secret' and length(decrypted_secret)>=32) then
   raise exception 'Configure the registration worker URL and secret in Vault first.';
 end if;
 if exists(select 1 from cron.job where jobname='registration-worker') then perform cron.unschedule('registration-worker'); end if;
 perform cron.schedule('registration-worker','* * * * *',$job$
   select net.http_post(
     url := (select decrypted_secret from vault.decrypted_secrets where name='registration_worker_url'),
     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||
       (select decrypted_secret from vault.decrypted_secrets where name='registration_worker_secret'))
       || coalesce((select jsonb_build_object('x-vercel-protection-bypass',decrypted_secret)
         from vault.decrypted_secrets where name='registration_vercel_bypass'),'{}'::jsonb),
     body := '{}'::jsonb, timeout_milliseconds := 55000
   );
 $job$);
end $$;
