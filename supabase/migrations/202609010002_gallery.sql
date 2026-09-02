-- Supabase-backed club gallery and staff-only publishing workflow.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'club_gallery',
  'club_gallery',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  title text not null check (length(trim(title)) > 0),
  alt_text text not null check (length(trim(alt_text)) > 0),
  caption text,
  trip_id uuid references public.trips(id) on delete set null,
  taken_on date,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_published boolean not null default false,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_photos_public_order_idx
  on public.gallery_photos (is_published, sort_order, taken_on desc, created_at desc);
create index if not exists gallery_photos_trip_id_idx
  on public.gallery_photos (trip_id);

drop trigger if exists gallery_photos_set_updated_at on public.gallery_photos;
create trigger gallery_photos_set_updated_at
before update on public.gallery_photos
for each row execute function public.set_updated_at();

alter table public.gallery_photos enable row level security;

drop policy if exists gallery_photos_read_published_or_staff
  on public.gallery_photos;
create policy gallery_photos_read_published_or_staff
on public.gallery_photos for select
to anon, authenticated
using (is_published or public.is_staff_or_admin(auth.uid()));

drop policy if exists gallery_photos_staff_insert on public.gallery_photos;
create policy gallery_photos_staff_insert
on public.gallery_photos for insert
to authenticated
with check (
  public.is_staff_or_admin(auth.uid())
  and uploaded_by = auth.uid()
);

drop policy if exists gallery_photos_staff_update on public.gallery_photos;
create policy gallery_photos_staff_update
on public.gallery_photos for update
to authenticated
using (public.is_staff_or_admin(auth.uid()))
with check (public.is_staff_or_admin(auth.uid()));

drop policy if exists gallery_photos_staff_delete on public.gallery_photos;
create policy gallery_photos_staff_delete
on public.gallery_photos for delete
to authenticated
using (public.is_staff_or_admin(auth.uid()));

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
        or public.is_staff_or_admin(auth.uid())
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
  and public.is_staff_or_admin(auth.uid())
);

drop policy if exists club_gallery_staff_update on storage.objects;
create policy club_gallery_staff_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'club_gallery'
  and public.is_staff_or_admin(auth.uid())
)
with check (
  bucket_id = 'club_gallery'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  and public.is_staff_or_admin(auth.uid())
);

drop policy if exists club_gallery_staff_delete on storage.objects;
create policy club_gallery_staff_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'club_gallery'
  and public.is_staff_or_admin(auth.uid())
);

grant select on public.gallery_photos to anon, authenticated;
grant insert, update, delete on public.gallery_photos to authenticated;
grant all on public.gallery_photos to service_role;

comment on column public.gallery_photos.alt_text is
  'Required description used as the public image alternative text.';
comment on column public.gallery_photos.is_published is
  'Only published metadata is visible to non-staff visitors.';
