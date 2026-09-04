create table if not exists public.account_age_declarations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_18_or_older boolean not null check (is_18_or_older),
  source text not null default 'email_signup'
    check (source in ('email_signup', 'membership_application')),
  declared_at timestamptz not null default now()
);

alter table public.account_age_declarations enable row level security;
revoke all on public.account_age_declarations from anon, authenticated;
grant all on public.account_age_declarations to service_role;
grant select on public.account_age_declarations to authenticated;

drop policy if exists account_age_declarations_select_self
  on public.account_age_declarations;
create policy account_age_declarations_select_self
on public.account_age_declarations for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.capture_signup_age_declaration()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if coalesce(new.raw_user_meta_data, '{}'::jsonb)
    @> '{"age_18_or_older": true}'::jsonb then
    insert into public.account_age_declarations (
      user_id, is_18_or_older, source
    ) values (
      new.id, true, 'email_signup'
    ) on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists capture_signup_age_declaration on auth.users;
create trigger capture_signup_age_declaration
after insert on auth.users
for each row execute function public.capture_signup_age_declaration();

revoke execute on function public.capture_signup_age_declaration()
  from public, anon, authenticated;
