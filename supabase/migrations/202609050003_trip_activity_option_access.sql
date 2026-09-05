-- Match the creation form's capability checks. Members need to read choices;
-- only accounts with trip-management permission may change the shared list.
drop policy if exists trip_tag_options_select_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_insert_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_update_staff_plus on public.trip_tag_options;
drop policy if exists trip_tag_options_delete_staff_plus on public.trip_tag_options;
create policy trip_tag_options_select_authenticated on public.trip_tag_options
 for select to authenticated using(true);
create policy trip_tag_options_insert_manager on public.trip_tag_options
 for insert to authenticated with check(public.has_admin_capability((select auth.uid()),'trips.update'));
create policy trip_tag_options_update_manager on public.trip_tag_options
 for update to authenticated using(public.has_admin_capability((select auth.uid()),'trips.update'))
 with check(public.has_admin_capability((select auth.uid()),'trips.update'));
create policy trip_tag_options_delete_manager on public.trip_tag_options
 for delete to authenticated using(public.has_admin_capability((select auth.uid()),'trips.update'));
