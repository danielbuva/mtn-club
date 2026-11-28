begin;

-- Keep the existing object keys. Both public and restricted images are served
-- through a request that evaluates gallery metadata and trip visibility.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('club_gallery','club_gallery',false,10485760,
  array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=false;

-- These policies also reconstruct Storage permissions for new databases whose
-- historical checkpoint contains the gallery table but no object policies.
drop policy if exists club_gallery_read_published on storage.objects;
drop policy if exists club_gallery_capability_read on storage.objects;
drop policy if exists club_gallery_visible_photo on storage.objects;
create policy club_gallery_visible_photo on storage.objects
for select to anon,authenticated
using (
  bucket_id='club_gallery' and exists (
    select 1 from public.gallery_photos photo
    where photo.storage_path=storage.objects.name
  )
);

drop policy if exists club_gallery_capability_insert on storage.objects;
create policy club_gallery_capability_insert on storage.objects
for insert to authenticated with check (
  bucket_id='club_gallery' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  and public.has_admin_capability((select auth.uid()),'gallery.create')
);

drop policy if exists club_gallery_capability_update on storage.objects;
create policy club_gallery_capability_update on storage.objects
for update to authenticated
using (bucket_id='club_gallery' and public.has_admin_capability((select auth.uid()),'gallery.update'))
with check (
  bucket_id='club_gallery' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  and public.has_admin_capability((select auth.uid()),'gallery.update')
);

drop policy if exists club_gallery_capability_delete on storage.objects;
create policy club_gallery_capability_delete on storage.objects
for delete to authenticated
using (bucket_id='club_gallery' and public.has_admin_capability((select auth.uid()),'gallery.delete'));

create function public.get_my_admin_capability_scopes()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_object_agg(c.key, scope.value), '{}'::jsonb)
  from public.admin_capabilities c
  cross join lateral (select public.admin_capability_scope(auth.uid(), c.key) as value) scope
  where auth.uid() is not null and c.is_active and scope.value is not null;
$$;
revoke all on function public.get_my_admin_capability_scopes() from public, anon, service_role;
grant execute on function public.get_my_admin_capability_scopes() to authenticated;

create function public.get_admin_membership_queue(p_tab text, p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb; page_size constant integer:=25;
begin
  if not public.has_admin_capability(auth.uid(),'membership.read') then
    raise exception 'Membership read permission required.' using errcode='42501';
  end if;
  if p_tab is null or p_tab not in ('review','members','exceptions','archive') then
    raise exception 'Unknown membership view.' using errcode='22023';
  end if;

  with accounts as materialized (
    select u.id, u.email, u.created_at, p.display_name, a.user_id as application_id,
      a.full_name, a.contact_email, a.age_status, a.guardian_consent, a.dues_payment_claimed,
      a.dues_claimed_at, a.primary_interest, a.experience_notes, a.status::text as status,
      a.created_at as applied_at, m.role, m.member_since, m.joined_on,
      payment.id as payment_id, payment.status as payment_status,
      case
        when public.has_membership_access(u.id) then 'members'
        when payment.status='rejected' or
          (a.status='confirmed' and payment.status is distinct from 'claimed') then 'archive'
        else 'review'
      end as tab
    from auth.users u
    left join public.profiles p on p.user_id=u.id
    left join public.membership_applications a on a.user_id=u.id
    left join public.memberships m on m.user_id=u.id
    left join lateral (
      select z.id,z.status from public.membership_zelle_payments z
      where z.user_id=u.id order by z.created_at desc,z.id desc limit 1
    ) payment on true
    where u.deleted_at is null
      and not exists(select 1 from public.registration_account_merges r where r.secondary_id=u.id)
  ), exceptions as materialized (
    select r.id,r.user_id,r.reason_code,r.reason_detail,r.status,r.created_at,p.display_name
    from public.membership_review_items r
    left join public.profiles p on p.user_id=r.user_id
    where r.status in ('pending','refund_requested')
  ), totals as (
    select jsonb_build_object(
      'review',count(*) filter(where tab='review'),
      'members',count(*) filter(where tab='members'),
      'archive',count(*) filter(where tab='archive'),
      'exceptions',(select count(*) from exceptions)
    ) as counts
    from accounts
  ), bounds as (
    select counts, least(greatest(coalesce(p_page,1),1),
      greatest(1,ceil((counts->>p_tab)::numeric/page_size)::integer)) as page
    from totals
  ), account_page as (
    select a.*
    from accounts a
    where a.tab=p_tab
    order by case when p_tab='members' then a.member_since end desc nulls last,
      coalesce(a.applied_at,a.created_at) desc, a.id
    limit page_size offset ((select page from bounds)-1)*page_size
  ), account_rows as (
    select a.*,
      case when a.tab='members' then jsonb_build_object(
        'user_id',a.id,'display_name',a.display_name,'role',coalesce(a.role,'regular'),
        'joined_on',a.joined_on,'member_since',
        coalesce((
          select min(grant_start)::date from (
            select starts_at as grant_start from public.membership_entitlements where user_id=a.id
            union all
            select starts_at from public.membership_access_overrides where user_id=a.id
          ) as grants
        ),a.member_since)
      ) else jsonb_build_object(
        'user_id',a.id,'full_name',coalesce(a.full_name,nullif(a.display_name,''),a.email,'Account'),
        'contact_email',coalesce(a.contact_email,a.email,''),
        'age_status',a.age_status,'guardian_consent',a.guardian_consent,
        'dues_payment_claimed',coalesce(a.dues_payment_claimed,false),
        'dues_claimed_at',a.dues_claimed_at,'primary_interest',a.primary_interest,
        'experience_notes',a.experience_notes,'status',coalesce(a.status,'account'),
        'created_at',coalesce(a.applied_at,a.created_at),
        'has_officer_payment',exists(select 1 from public.membership_zelle_payments z
          where z.user_id=a.id and z.claim_source='admin'),
        'payment',(select jsonb_build_object('status',z.status,'claim_source',z.claim_source,
          'claimed_at',z.claimed_at,'internal_note',z.internal_note)
          from public.membership_zelle_payments z where z.id=a.payment_id)
      ) end as data
    from account_page a
  ), exception_page as (
    select * from exceptions where p_tab='exceptions'
    order by created_at,id limit page_size offset ((select page from bounds)-1)*page_size
  )
  select jsonb_build_object(
    'counts',counts,'page',page,'pageSize',page_size,
    'rows',coalesce(case when p_tab='exceptions' then
      (select jsonb_agg(to_jsonb(e) order by e.created_at,e.id) from exception_page e)
    else
      (select jsonb_agg(a.data order by case when p_tab='members' then a.member_since end desc nulls last,
        coalesce(a.applied_at,a.created_at) desc,a.id) from account_rows a)
    end,'[]'::jsonb)
  ) into payload from bounds;
  return payload;
end $$;
revoke all on function public.get_admin_membership_queue(text,integer) from public, anon, service_role;
grant execute on function public.get_admin_membership_queue(text,integer) to authenticated;

-- A production build must see this RPC before adopting the new app contract.
create function public.handoff_schema_ready()
returns boolean language sql immutable set search_path='' as $$
  select true;
$$;
revoke all on function public.handoff_schema_ready() from public,anon,authenticated;
grant execute on function public.handoff_schema_ready() to service_role;

commit;
