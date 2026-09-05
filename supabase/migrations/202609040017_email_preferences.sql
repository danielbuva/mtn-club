create function registration_private.preference_boolean(n jsonb,k text,d boolean) returns boolean
language sql immutable set search_path='' as $$
 select case when jsonb_typeof(n->k)='boolean' then (n->>k)::boolean else d end;
$$;
-- Missing optional marketing choices default off. Never rewrite existing choices during migration.
create function registration_private.email_preferences(p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'email',coalesce(registration_private.preference_boolean(n,'email',null),true),
  'tripUpdates',coalesce(registration_private.preference_boolean(n,'tripUpdates',null),true) and legacy,
  'tripReminders',coalesce(registration_private.preference_boolean(n,'tripReminders',null),registration_private.preference_boolean(n,'announcements',null),true),
  'announcements',coalesce(registration_private.preference_boolean(n,'announcements',null),subscribed) and subscribed,
  'general',coalesce(registration_private.preference_boolean(n,'general',null),false) and subscribed,
  'memberStories',coalesce(registration_private.preference_boolean(n,'memberStories',null),false) and subscribed,
  'safetyAlerts',coalesce(registration_private.preference_boolean(n,'safetyAlerts',null),true))
 from (select coalesce((select notification_settings from public.profile_private where user_id=p_user),'{}') n,
 coalesce((select trip_email_notifications from public.user_preferences where user_id=p_user),true) legacy,
 coalesce((select subscribed from public.mailing_list_subscriptions where user_id=p_user),false) subscribed) prefs;
$$;
create function public.get_my_email_preferences() returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 return registration_private.email_preferences(auth.uid());
end $$;
revoke all on function public.get_my_email_preferences() from public,anon;
grant execute on function public.get_my_email_preferences() to authenticated;
create table public.profile_email_consent_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 preferences jsonb not null, created_at timestamptz not null default now()
);
alter table public.profile_email_consent_events enable row level security;
revoke all on public.profile_email_consent_events from public,anon,authenticated,service_role;
create trigger profile_email_consent_immutable before update or delete on public.profile_email_consent_events
 for each row execute function registration_private.immutable_document();
create function public.save_privacy_email_preferences(p_privacy jsonb,p_preferences jsonb,p_expected jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current_prefs jsonb; marketing boolean; address text; begin
 if uid is null then raise exception 'Sign in required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('email-preferences:'||uid,0));
 if jsonb_typeof(p_preferences) is distinct from 'object' or jsonb_typeof(p_privacy) is distinct from 'object' then raise exception 'Invalid privacy settings.'; end if;
 if (select count(*) from jsonb_object_keys(p_preferences))<>7 or exists(select 1 from jsonb_each(p_preferences) x
  where x.key not in ('email','tripUpdates','tripReminders','announcements','general','memberStories','safetyAlerts') or jsonb_typeof(x.value)<>'boolean')
  or exists(select 1 from jsonb_each(p_privacy) x where x.key not in
   ('profileVisible','shareEmail','sharePhone','shareGear','shareCarpooling','shareCarInfo','shareNeighborhood') or jsonb_typeof(x.value)<>'boolean') then
   raise exception 'Choose yes or no for each email and privacy setting.'; end if;
 insert into public.profile_private(user_id) values(uid) on conflict do nothing;
 perform user_id from public.profile_private where user_id=uid for update;
 current_prefs:=registration_private.email_preferences(uid);
 if current_prefs is distinct from p_expected then raise exception 'Email preferences changed elsewhere. Refresh and review your choices.'; end if;
 if p_preferences is distinct from current_prefs then
  update public.profile_private set notification_settings=coalesce(notification_settings,'{}')||p_preferences,updated_at=now() where user_id=uid;
  if p_preferences->'tripUpdates' is distinct from current_prefs->'tripUpdates' then
   insert into public.user_preferences(user_id,trip_email_notifications) values(uid,(p_preferences->>'tripUpdates')::boolean)
    on conflict(user_id) do update set trip_email_notifications=excluded.trip_email_notifications;
  end if;
  marketing:=(p_preferences->>'announcements')::boolean or (p_preferences->>'general')::boolean or (p_preferences->>'memberStories')::boolean;
  if marketing is distinct from coalesce((select subscribed from public.mailing_list_subscriptions where user_id=uid),false) then
   select email into address from auth.users where id=uid;
   perform public.set_mailing_list_subscription(address,marketing,'account_settings');
  end if;
  insert into public.profile_email_consent_events(user_id,preferences) values(uid,p_preferences);
 end if;
 update public.profile_private set privacy_settings=coalesce(privacy_settings,'{}')||p_privacy,updated_at=now() where user_id=uid;
 return registration_private.email_preferences(uid);
end $$;
revoke all on function public.save_privacy_email_preferences(jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_privacy_email_preferences(jsonb,jsonb,jsonb) to authenticated;
create or replace function registration_private.email_enabled(p_user uuid,p_kind text) returns boolean
language sql stable security definer set search_path='' as $$
 select (p->>'email')::boolean and (p->>'tripUpdates')::boolean
 and (p_kind<>'reminder' or (p->>'tripReminders')::boolean)
 and (p_kind not in ('trip_changed','trip_canceled') or (p->>'safetyAlerts')::boolean)
 from (select registration_private.email_preferences(p_user) p) settings;
$$;
create function public.export_club_email_recipients(p_topic text default 'announcements') returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'mailing_list.export') then
  raise exception 'Mailing-list export permission required.'; end if;
 if p_topic not in ('announcements','general','memberStories') then raise exception 'Choose a supported email category.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('email',s.email,'displayName',coalesce(p.display_name,''),
 'consentSource',s.consent_source,'subscribedAt',s.subscribed_at) order by s.email)
 from public.mailing_list_subscriptions s left join public.profiles p on p.user_id=s.user_id
 where s.subscribed and (registration_private.email_preferences(s.user_id)->>'email')::boolean
 and (registration_private.email_preferences(s.user_id)->>p_topic)::boolean),'[]');
end $$;
revoke all on function public.export_club_email_recipients(text) from public,anon;
grant execute on function public.export_club_email_recipients(text) to authenticated;
