-- Runs against either environment; all fixtures and mutations are rolled back.
begin;
-- Hide existing notices only inside this transaction, for isolated selection tests.
update public.announcements set status = 'draft';
insert into public.announcements(slug,title,status,starts_at,ends_at,created_at) values
('test-before','Future','published',now()+interval '1 second',now()+interval '1 day',now()),
('test-start','At start','published',now(),now()+interval '1 second',now()),
('test-end','At end','published',now()-interval '1 day',now(),now()),
('test-past','Past','published',now()-interval '2 days',now()-interval '1 day',now()),
('test-draft','Draft','draft',now(),now()+interval '1 day',now()),
('test-archived','Archived','archived',now(),now()+interval '1 day',now());
set local role anon;
do $$ begin
 if (select slug from public.get_active_announcement()) <> 'test-start' then raise exception 'Boundary selection failed'; end if;
 if exists(select 1 from public.announcements where slug in ('test-before','test-draft','test-archived')) then raise exception 'Private content leaked'; end if;
 if not exists(select 1 from public.announcements where slug = 'test-past') then raise exception 'Archive unavailable'; end if;
 if exists(select 1 from public.announcements where slug = 'invalid-slug') then raise exception 'Invalid slug returned data'; end if;
 begin
  insert into public.announcements(slug,title,starts_at,ends_at) values('test-anon','Denied',now(),now()+interval '1 day');
  raise exception 'Anonymous insert allowed';
 exception when insufficient_privilege then null; end;
 begin update public.announcements set title='Denied'; raise exception 'Anonymous update allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.announcements; raise exception 'Anonymous delete allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.announcements(id,slug,title,status,starts_at,ends_at,created_at) values
('ffffffff-ffff-ffff-ffff-fffffffffff1','test-overlap-a','Overlap A','published',now(),now()+interval '1 day',now()+interval '1 second'),
('ffffffff-ffff-ffff-ffff-fffffffffff2','test-overlap-b','Overlap B','published',now(),now()+interval '1 day',now()+interval '1 second');
set local role anon;
do $$ begin
 if (select slug from public.get_active_announcement()) <> 'test-overlap-b' then raise exception 'Tie selection is not deterministic'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.announcements where slug = 'test-draft') then raise exception 'Member read draft'; end if;
 begin insert into public.announcements(slug,title,starts_at,ends_at) values('test-member','Denied',now(),now()+interval '1 day'); raise exception 'Member insert allowed'; exception when insufficient_privilege then null; end;
 update public.announcements set title = 'Denied' where slug = 'test-start';
 if found then raise exception 'Member update allowed'; end if;
 delete from public.announcements where slug = 'test-start';
 if found then raise exception 'Member delete allowed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select user_id::text from public.admin_user_roles ur join public.admin_roles r on r.id=ur.role_id where r.is_super_admin limit 1),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.announcements where slug = 'test-draft') then raise exception 'Admin cannot preview draft'; end if;
 insert into public.announcements(slug,title,starts_at,ends_at) values('test-admin','Admin draft',now(),now()+interval '1 day');
 update public.announcements set status='published' where slug='test-admin';
 if not found then raise exception 'Admin update denied'; end if;
 delete from public.announcements where slug='test-admin';
 if not found then raise exception 'Admin delete denied'; end if;
 begin insert into public.announcements(slug,title,starts_at,ends_at) values('test-invalid','Invalid',now(),now()); raise exception 'Invalid schedule allowed'; exception when check_violation then null; end;
end $$;
reset role;
rollback;
