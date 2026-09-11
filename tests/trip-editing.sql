begin;
do $$
declare
 u uuid := gen_random_uuid(); r uuid := gen_random_uuid(); t uuid := gen_random_uuid(); denied boolean := false;
begin
 insert into auth.users(id,email) values(u,u::text||'@example.test');
 insert into public.profiles(user_id,display_name) values(u,'Trip edit regression') on conflict do nothing;
 insert into public.admin_roles(id,key,name) values(r,'edit_'||replace(r::text,'-','_'),'Trip edit regression');
 insert into public.admin_capabilities(key,resource,action,label) values
 ('overview.read','overview','read','Overview'),('trips.update','trips','update','Edit trips') on conflict do nothing;
 insert into public.admin_role_grants(role_id,capability_key,scope) values(r,'overview.read','all'),(r,'trips.update','all');
 insert into public.admin_user_roles(user_id,role_id) values(u,r);
 insert into public.memberships(user_id,status,role) values(u,'pending','regular') on conflict(user_id) do update set status='pending';
 perform set_config('request.jwt.claim.sub',u::text,true);
 set local role authenticated;
 insert into public.trips(id,title,created_by,starts_at,ends_at,rsvp_deadline,is_all_day)
 values(t,'Timezone regression',u,'2026-09-13 07:00Z','2026-09-14 06:59:59Z','2026-09-13 01:00Z',true);
 begin
  update public.trips set starts_at='2026-09-13 00:00Z' where id=t;
 exception when raise_exception then
  if sqlerrm <> 'Registration must close by the trip start.' then raise; end if;
  denied:=true;
 end;
 if not denied then raise exception 'Deadline guard was bypassed'; end if;
 update public.trips set title='Saved by a pending-member admin',is_all_day=false,starts_at='2026-09-13 07:00Z',ends_at='2026-09-14 06:59:59Z' where id=t;
 if not found then raise exception 'Admin event save denied'; end if;
 if exists(select 1 from public.trips where id=t and is_all_day) then raise exception 'Saved time still marked TBA'; end if;
 insert into public.trip_private(trip_id,meetup_point) values(t,'Meeting point') on conflict(trip_id) do update set meetup_point=excluded.meetup_point;
 insert into public.trip_tag_options(tag) values('edit-regression') on conflict do nothing;
 insert into public.trip_leaders(trip_id,user_id) values(t,u) on conflict do nothing;
 reset role;
 set local role service_role;
 if not exists(select 1 from public.trip_leaders where trip_id=t and user_id=u) then raise exception 'Server cannot read saved leader assignments'; end if;
 if not exists(select 1 from public.trip_private where trip_id=t) then raise exception 'Server cannot read private event details'; end if;
 if not exists(select 1 from public.trip_tag_options where tag='edit-regression') then raise exception 'Server cannot read activity options'; end if;
 reset role;
end $$;
rollback;
