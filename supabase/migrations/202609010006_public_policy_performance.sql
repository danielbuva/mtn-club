-- Keep public schedule/gallery policies fast and foreign-key maintenance indexed.

drop policy if exists club_hosts_staff_manage on public.club_hosts;
drop policy if exists club_hosts_staff_insert on public.club_hosts;
create policy club_hosts_staff_insert
on public.club_hosts for insert
to authenticated
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists club_hosts_staff_update on public.club_hosts;
create policy club_hosts_staff_update
on public.club_hosts for update
to authenticated
using (public.is_staff_or_admin((select auth.uid())))
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists club_hosts_staff_delete on public.club_hosts;
create policy club_hosts_staff_delete
on public.club_hosts for delete
to authenticated
using (public.is_staff_or_admin((select auth.uid())));

drop policy if exists trip_hosts_staff_manage on public.trip_hosts;
drop policy if exists trip_hosts_staff_insert on public.trip_hosts;
create policy trip_hosts_staff_insert
on public.trip_hosts for insert
to authenticated
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists trip_hosts_staff_update on public.trip_hosts;
create policy trip_hosts_staff_update
on public.trip_hosts for update
to authenticated
using (public.is_staff_or_admin((select auth.uid())))
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists trip_hosts_staff_delete on public.trip_hosts;
create policy trip_hosts_staff_delete
on public.trip_hosts for delete
to authenticated
using (public.is_staff_or_admin((select auth.uid())));

drop policy if exists schedule_review_items_staff_manage
  on public.schedule_review_items;
create policy schedule_review_items_staff_manage
on public.schedule_review_items for all
to authenticated
using (public.is_staff_or_admin((select auth.uid())))
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists gallery_photos_read_published_or_staff
  on public.gallery_photos;
create policy gallery_photos_read_published_or_staff
on public.gallery_photos for select
to anon, authenticated
using (
  is_published
  or public.is_staff_or_admin((select auth.uid()))
);

drop policy if exists gallery_photos_staff_insert on public.gallery_photos;
create policy gallery_photos_staff_insert
on public.gallery_photos for insert
to authenticated
with check (
  public.is_staff_or_admin((select auth.uid()))
  and uploaded_by = (select auth.uid())
);

drop policy if exists gallery_photos_staff_update on public.gallery_photos;
create policy gallery_photos_staff_update
on public.gallery_photos for update
to authenticated
using (public.is_staff_or_admin((select auth.uid())))
with check (public.is_staff_or_admin((select auth.uid())));

drop policy if exists gallery_photos_staff_delete on public.gallery_photos;
create policy gallery_photos_staff_delete
on public.gallery_photos for delete
to authenticated
using (public.is_staff_or_admin((select auth.uid())));

drop policy if exists club_gallery_read_published on storage.objects;
create policy club_gallery_read_published
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'club_gallery'
  and exists (
    select 1
    from public.gallery_photos
    where gallery_photos.storage_path = storage.objects.name
      and (
        gallery_photos.is_published
        or public.is_staff_or_admin((select auth.uid()))
      )
  )
);

drop policy if exists club_gallery_staff_insert on storage.objects;
create policy club_gallery_staff_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'club_gallery'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  and public.is_staff_or_admin((select auth.uid()))
);

drop policy if exists club_gallery_staff_update on storage.objects;
create policy club_gallery_staff_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'club_gallery'
  and public.is_staff_or_admin((select auth.uid()))
)
with check (
  bucket_id = 'club_gallery'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  and public.is_staff_or_admin((select auth.uid()))
);

drop policy if exists club_gallery_staff_delete on storage.objects;
create policy club_gallery_staff_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'club_gallery'
  and public.is_staff_or_admin((select auth.uid()))
);

create index if not exists club_hosts_linked_user_id_idx
  on public.club_hosts (linked_user_id);
create index if not exists gallery_photos_uploaded_by_idx
  on public.gallery_photos (uploaded_by);
create index if not exists membership_access_overrides_granted_by_idx
  on public.membership_access_overrides (granted_by);
create index if not exists membership_access_overrides_revoked_by_idx
  on public.membership_access_overrides (revoked_by);
create index if not exists membership_account_restrictions_updated_by_idx
  on public.membership_account_restrictions (updated_by);
create index if not exists membership_review_items_payment_id_idx
  on public.membership_review_items (payment_id);
create index if not exists membership_review_items_reviewed_by_idx
  on public.membership_review_items (reviewed_by);
create index if not exists membership_review_items_user_id_idx
  on public.membership_review_items (user_id);
create index if not exists schedule_review_items_reviewed_by_idx
  on public.schedule_review_items (reviewed_by);
