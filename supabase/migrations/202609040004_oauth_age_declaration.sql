create or replace function public.declare_my_age_18_or_older()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required';
  end if;
  insert into public.account_age_declarations (
    user_id, is_18_or_older, source
  ) values (
    auth.uid(), true, 'oauth_signup'
  ) on conflict (user_id) do nothing;
end;
$$;

revoke execute on function public.declare_my_age_18_or_older()
  from public, anon;
grant execute on function public.declare_my_age_18_or_older()
  to authenticated;
alter table public.account_age_declarations
  drop constraint if exists account_age_declarations_source_check;
alter table public.account_age_declarations
  add constraint account_age_declarations_source_check
  check (source in ('email_signup', 'oauth_signup', 'membership_application'));
