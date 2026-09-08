-- Keep a public byline snapshot without exposing or depending on private profiles.
alter table public.announcements add column author_name text
  check (author_name is null or length(trim(author_name)) between 1 and 120);
update public.announcements a
set author_name = left(trim(p.display_name), 120)
from public.profiles p
where p.user_id = a.created_by and nullif(trim(p.display_name), '') is not null;
update public.announcements set author_name = 'Dax Whitaker'
where slug = 'fall-2026-general-meeting';
