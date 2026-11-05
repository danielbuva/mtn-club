-- A checkpoint distinguishes completed submissions from legacy parallel-write failures.
alter table public.membership_applications
  add column signup_completed_at timestamptz;

create or replace function public.submit_membership_signup(
  p_user_id uuid,
  p_full_name text,
  p_contact_email text,
  p_age_status public.membership_age_status,
  p_dues_payment_claimed boolean,
  p_primary_interest text,
  p_experience_notes text,
  p_mailing_list_opt_in boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.membership_applications%rowtype;
  v_subscription public.mailing_list_subscriptions%rowtype;
  v_consent public.mailing_list_consent_events%rowtype;
  v_new_application boolean;
  v_name_parts text[];
  v_amount integer;
  v_currency text;
begin
  -- The server action verifies identity (including new, unconfirmed accounts).
  -- This RPC must never be callable directly with a member's JWT.
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  if p_user_id is null or p_age_status is null
    or p_dues_payment_claimed is null or p_mailing_list_opt_in is null then
    raise exception 'signup fields required';
  end if;

  -- Serialize retries, including when there is no application row yet. Use the
  -- payment-review lock too so reconciliation cannot recreate a reviewed claim.
  perform pg_advisory_xact_lock(
    hashtextextended('zelle-payment-status:' || p_user_id::text, 41)
  );

  insert into public.membership_applications (
    user_id, full_name, contact_email, age_status, guardian_consent,
    dues_payment_claimed, dues_claimed_at, primary_interest, experience_notes
  ) values (
    p_user_id, trim(p_full_name), lower(trim(p_contact_email)), p_age_status,
    case when p_age_status = 'adult' then 'not_required'::public.guardian_consent_status
      else 'pending'::public.guardian_consent_status end,
    p_dues_payment_claimed, case when p_dues_payment_claimed then now() end,
    p_primary_interest, nullif(p_experience_notes, '')
  ) on conflict (user_id) do nothing
  returning * into v_application;
  v_new_application := found;

  if not v_new_application then
    select * into strict v_application from public.membership_applications
      where user_id = p_user_id for update;
  end if;
  if v_application.signup_completed_at is not null then
    return v_application.user_id;
  end if;

  -- Existing application data and review decisions are authoritative on retry.
  v_name_parts := regexp_split_to_array(trim(v_application.full_name), '\s+');
  insert into public.profiles as profiles (user_id, display_name, first_name, last_name)
  values (p_user_id, v_application.full_name, v_name_parts[1],
    nullif(array_to_string(v_name_parts[2:array_length(v_name_parts, 1)], ' '), ''))
  on conflict (user_id) do update set
    display_name = case when v_new_application then excluded.display_name
      else coalesce(nullif(trim(profiles.display_name), ''), excluded.display_name) end,
    first_name = case when v_new_application then excluded.first_name
      else coalesce(nullif(trim(profiles.first_name), ''), excluded.first_name) end,
    last_name = case when v_new_application then excluded.last_name
      else coalesce(nullif(trim(profiles.last_name), ''), excluded.last_name) end;

  insert into public.memberships (user_id, status, role)
    values (p_user_id, 'pending', 'regular') on conflict (user_id) do nothing;

  if v_application.age_status = 'adult' then
    insert into public.account_age_declarations (user_id, is_18_or_older, source)
      values (p_user_id, true, 'membership_application') on conflict (user_id) do nothing;
  end if;

  select * into v_subscription from public.mailing_list_subscriptions
    where user_id = p_user_id for update;
  if not found then
    -- Recover either half of the old subscription/event pair. A later opt-out
    -- always wins over a retried signup's opt-in checkbox.
    select * into v_consent from public.mailing_list_consent_events
      where user_id = p_user_id order by created_at desc, id desc limit 1;
    if found then
      insert into public.mailing_list_subscriptions (
        user_id, email, subscribed, consent_source, subscribed_at, unsubscribed_at
      ) values (
        p_user_id, v_consent.email, v_consent.subscribed, v_consent.consent_source,
        case when v_consent.subscribed then v_consent.created_at end,
        case when not v_consent.subscribed then v_consent.created_at end
      ) returning * into v_subscription;
    elsif p_mailing_list_opt_in then
      insert into public.mailing_list_subscriptions (
        user_id, email, subscribed, consent_source, subscribed_at
      ) values (p_user_id, v_application.contact_email, true, 'membership_signup', now())
      returning * into v_subscription;
    end if;
  end if;
  if v_subscription.subscribed and v_subscription.consent_source = 'membership_signup'
    and not exists (
      select 1 from public.mailing_list_consent_events
      where user_id = p_user_id and consent_source = 'membership_signup'
    ) then
    insert into public.mailing_list_consent_events (
      user_id, email, subscribed, consent_source, created_at
    ) values (p_user_id, v_subscription.email, true, 'membership_signup', v_subscription.subscribed_at);
  end if;

  -- Existing payment history (including rejected/reversed) is authoritative.
  -- A retry must never replace it with another unreviewed claim.
  if v_application.status = 'submitted' and v_application.dues_payment_claimed
    and not exists (select 1 from public.membership_zelle_payments where user_id = p_user_id) then
    select dues_amount_cents, currency into strict v_amount, v_currency
      from public.club_admin_settings where id;
    insert into public.membership_zelle_payments (
      user_id, amount_cents, currency, status, claim_source, claimed_at
    ) values (p_user_id, v_amount, v_currency, 'claimed', 'membership_signup', v_application.dues_claimed_at)
    on conflict (user_id) where status = 'claimed' do nothing;
  end if;

  if not exists (select 1 from public.admin_activity_events
    where subject_user_id = p_user_id and action = 'membership_application_submitted') then
    insert into public.admin_activity_events (
      actor_user_id, subject_user_id, action, resource_type, resource_id, summary, after_data
    ) values (
      p_user_id, p_user_id, 'membership_application_submitted', 'membership_application', p_user_id::text,
      v_application.full_name || ' submitted a membership application.',
      jsonb_build_object('guardian_consent', v_application.guardian_consent,
        'payment_claimed', v_application.dues_payment_claimed,
        'mailing_list_opt_in', coalesce(v_subscription.subscribed, false))
    );
  end if;

  update public.membership_applications set signup_completed_at = now()
    where user_id = p_user_id;
  return v_application.user_id;
end;
$$;

revoke all on function public.submit_membership_signup(uuid,text,text,public.membership_age_status,boolean,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.submit_membership_signup(uuid,text,text,public.membership_age_status,boolean,text,text,boolean)
  to service_role;
