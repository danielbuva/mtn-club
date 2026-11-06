begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); minor uuid:=gen_random_uuid(); member_minor uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid(); tid2 uuid:=gen_random_uuid();
 waiver uuid; result jsonb; status jsonb; request uuid; year integer; payload jsonb; tok text; ses text; rec text; reason text[];
 h text:=repeat('a',64); begin
 year:=extract(year from now())::integer-case when extract(month from now())<7 then 1 else 0 end;
 insert into auth.users(id,email) values(owner_id,owner_id||'@example.test'),(minor,'minor@example.test'),(stranger,stranger||'@example.test');
 insert into public.profiles(user_id,display_name) values(minor,'Riley Minor') on conflict(user_id) do update set display_name=excluded.display_name;
 insert into public.admin_user_roles(user_id,role_id) select owner_id,id from public.admin_roles where is_super_admin;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 perform public.set_registration_enabled(true);
 waiver:=public.create_annual_waiver(jsonb_build_object('event','Hiking guardian fixture','sponsor','UNLV Mountain Club',
  'effectiveFrom',year||'-07-01','activities',jsonb_build_array('hiking'),'risks','Hiking involves falls, heat illness, serious injury and death.'));
 perform public.publish_annual_waiver(waiver,'Reviewed fixture only');
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by) values
  (tid,'Guardian hike',now()+interval '2 days',now()+interval '2 days 4 hours',5,owner_id),
  (tid2,'Second hike',now()+interval '3 days',now()+interval '3 days 4 hours',5,owner_id);
 perform public.save_trip_informed_risks(tid,0,array['Steep rocky terrain.'],array['hiking']);
 perform public.save_trip_informed_risks(tid2,0,array['Loose gravel.'],array['hiking']);
 update public.trip_registration_settings set annual_waiver=true,waiver_required=true,eligibility='account' where trip_id in (tid,tid2);

 -- Server-only functions refuse non-server callers.
 begin perform public.guardian_get_request(h,null); raise exception 'CLIENT_READ_TOKEN';
 exception when others then if sqlerrm<>'Server access required.' then raise; end if; end;
 if has_function_privilege('authenticated','public.guardian_sign(text,text,text,jsonb)','execute')
 or has_function_privilege('anon','public.guardian_get_request(text,text)','execute')
 or not has_function_privilege('service_role','public.guardian_verify_code(text,text,text)','execute')
 or has_function_privilege('anon','public.get_my_guardian_status(uuid)','execute') then raise exception 'Guardian grants are wrong'; end if;

 -- Adults cannot open guardian requests.
 perform set_config('request.jwt.claim.sub',stranger::text,true);
 perform public.declare_registration_age(true);
 begin perform public.guardian_open_request(repeat('b',64),'same_device',tid); raise exception 'ADULT_OPENED';
 exception when others then if sqlerrm not like 'Guardian signing is only%' then raise; end if; end;

 -- Minor opens a same-device request from the trip.
 perform set_config('request.jwt.claim.sub',minor::text,true);
 perform public.declare_registration_age(false);
 reason:=registration_private.eligibility(tid,minor);
 if not 'A parent or legal guardian needs to sign before you can register.'=any(reason) then raise exception 'Expected guardian reason, got %',reason; end if;
 status:=public.get_my_guardian_status(tid);
 if status->>'trip'<>'needs_signature' or status->'waiver'->>'state'<>'needs_signature' then raise exception 'Bad initial status %',status; end if;
 tok:=encode(sha256('same-device-token'::bytea),'hex');
 request:=(public.guardian_open_request(tok,'same_device',tid)->>'requestId')::uuid;
 if (public.guardian_open_request(encode(sha256('again'::bytea),'hex'),'same_device',tid)->>'requestId')::uuid<>request then raise exception 'Duplicate open request'; end if;

 perform set_config('request.jwt.claim.role','service_role',true);
 result:=public.guardian_get_request(tok,null);
 if result->>'state'<>'open' or result->>'participantName'<>'Riley Minor' or result->'prefill' is distinct from 'null'::jsonb
 or (result->'waiver'->>'id')::uuid<>waiver then raise exception 'Bad public request %',result; end if;
 if public.guardian_get_request(repeat('c',64),null)->>'state'<>'invalid' then raise exception 'Unknown token accepted'; end if;
 begin perform public.guardian_start_verification(tok,'minor@example.test',encode(sha256('c1'::bytea),'hex')); raise exception 'OWN_EMAIL';
 exception when others then if sqlerrm not like 'Use the parent or guardian''s own email%' then raise; end if; end;
 perform public.guardian_start_verification(tok,'Parent@Example.test',encode(sha256('123456'::bytea),'hex'));
 begin perform public.guardian_start_verification(tok,'parent@example.test',encode(sha256('654321'::bytea),'hex')); raise exception 'NO_COOLDOWN';
 exception when others then if sqlerrm not like 'A code was just sent%' then raise; end if; end;
 if (public.guardian_verify_code(tok,encode(sha256('000000'::bytea),'hex'),repeat('d',64))->>'reason')<>'wrong' then raise exception 'Wrong code accepted'; end if;
 ses:=encode(sha256('session-1'::bytea),'hex');
 result:=public.guardian_verify_code(tok,encode(sha256('123456'::bytea),'hex'),ses);
 if not (result->>'ok')::boolean or result->>'email'<>'parent@example.test' then raise exception 'Correct code rejected %',result; end if;
 if public.guardian_get_request(tok,ses)->>'verifiedEmail'<>'parent@example.test' then raise exception 'Session not recognized'; end if;

 payload:=jsonb_build_object('guardian',jsonb_build_object('name','Jordan Parent','relationship','Mother','phone','702-555-0100','authority',true),
  'participant',jsonb_build_object('birthDate',(current_date-interval '16 years')::date,'address','4505 S Maryland Pkwy, Las Vegas'),
  'emergencyContact',jsonb_build_object('name','Jordan Parent','relationship','Mother','phone','702-555-0100','address','4505 S Maryland Pkwy','notes','Peanut allergy'),
  'initials',jsonb_build_array('JP','JP','JP','JP','JP','JP','JP'),'waiverId',waiver,'waiverAgreed',true,'signatureName','Jordan Parent');
 rec:=encode(sha256('record-1'::bytea),'hex');
 begin perform public.guardian_sign(tok,ses,rec,payload||'{"signatureName":"Someone Else"}'); raise exception 'SIGNATURE_MISMATCH';
 exception when others then if sqlerrm not like 'Your signature must match%' then raise; end if; end;
 begin perform public.guardian_sign(tok,ses,rec,jsonb_set(payload,'{guardian,authority}','false')); raise exception 'NO_AUTHORITY';
 exception when others then if sqlerrm not like 'Confirm that you are%' then raise; end if; end;
 begin perform public.guardian_sign(tok,ses,rec,jsonb_set(payload,'{participant,birthDate}',to_jsonb((current_date-interval '19 years')::date))); raise exception 'ADULT_DOB';
 exception when others then if sqlerrm not like 'Guardian signing is for participants under 18%' then raise; end if; end;
 begin perform public.guardian_sign(tok,repeat('e',64),rec,payload); raise exception 'NO_SESSION';
 exception when others then if sqlerrm not like 'Verify your email again%' then raise; end if; end;
 result:=public.guardian_sign(tok,ses,rec,payload);
 if (result->>'autoApproved')::boolean then raise exception 'First guardian must not auto-approve'; end if;
 if not (public.guardian_sign(tok,ses,rec,payload)->>'duplicate')::boolean then raise exception 'Duplicate sign not idempotent'; end if;

 -- Signed is not approved: no coverage, clear status, officer sees it.
 perform set_config('request.jwt.claim.role','authenticated',true);
 if registration_private.waiver_complete(tid,minor) then raise exception 'Unreviewed guardian signature counted'; end if;
 if not 'Your guardian signed. The club is reviewing it before you can register.'=any(registration_private.eligibility(tid,minor)) then raise exception 'Expected review reason'; end if;
 status:=public.get_my_guardian_status(tid);
 if status->>'trip'<>'awaiting_review' or status->'guardian'->>'email'<>'parent@example.test' or status->'guardian'->>'emailVerifiedAt' is null then raise exception 'Bad pending status %',status; end if;
 begin perform public.guardian_open_request(encode(sha256('dup'::bytea),'hex'),'same_device',tid2); raise exception 'DUPLICATE_REQUEST';
 exception when others then if sqlerrm<>'Nothing needs a guardian signature right now.' then raise; end if; end;
 if (select emergency_contact->>'notes' from public.profile_private where user_id=minor)<>'Peanut allergy' then raise exception 'Emergency contact not saved'; end if;
 begin perform public.get_guardian_review_queue(); raise exception 'MINOR_READ_QUEUE';
 exception when others then if sqlerrm<>'Guardian review permission required.' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 result:=public.get_guardian_review_queue();
 if jsonb_array_length(result->'requests')<>1 or result->'requests'->0->'guardian'->>'name'<>'Jordan Parent'
 or result->'requests'->0->'evidence'->>'method'<>'email_code' or result->'requests'->0->'evidence' ? 'initials' then raise exception 'Bad queue %',result; end if;
 begin perform public.review_guardian_request(request,'rejected',null,false); raise exception 'REJECT_NO_REASON';
 exception when others then if sqlerrm not like 'Add a short reason%' then raise; end if; end;
 perform public.review_guardian_request(request,'clarification','Please confirm the relationship listed.',false);
 if registration_private.waiver_complete(tid,minor) then raise exception 'Clarification counted as approval'; end if;
 if jsonb_array_length(public.get_guardian_review_queue()->'requests')<>1 then raise exception 'Clarification left the queue'; end if;
 perform public.review_guardian_request(request,'approved',null,true);
 begin perform public.review_guardian_request(request,'rejected','Too late now.',false); raise exception 'DOUBLE_DECISION';
 exception when others then if sqlerrm not like 'This request was already decided%' then raise; end if; end;
 if jsonb_array_length(public.get_guardian_review_queue()->'requests')<>0 then raise exception 'Approved request stayed queued'; end if;

 -- Approved coverage applies to every covered trip without new guardian action.
 perform set_config('request.jwt.claim.sub',minor::text,true);
 if not registration_private.waiver_complete(tid,minor) or not registration_private.waiver_complete(tid2,minor) then raise exception 'Approved signature did not cover trips'; end if;
 if cardinality(registration_private.eligibility(tid2,minor))<>0 then raise exception 'Covered trip still blocked'; end if;
 if public.get_my_guardian_status(tid2)->>'trip'<>'covered' then raise exception 'Covered trip status wrong'; end if;
 if (select valid_until from public.registration_signatures where id=registration_private.annual_signature(waiver,minor,current_date,current_date))
  >(current_date+interval '2 years')::date then raise exception 'Coverage exceeded 18th birthday/waiver end'; end if;

 -- Guardian withdraws using the long-lived record link and a fresh code.
 perform set_config('request.jwt.claim.role','service_role',true);
 if public.guardian_get_request(rec,null)->>'state'<>'signed' then raise exception 'Record link not signed'; end if;
 begin perform public.guardian_start_verification(rec,'other@example.test',encode(sha256('1'::bytea),'hex')); raise exception 'OTHER_EMAIL_RECORD';
 exception when others then if sqlerrm not like 'Use the email address you signed with%' then raise; end if; end;
 -- now() is fixed inside this transaction; age the earlier code past the resend cooldown.
 update public.guardian_email_codes set created_at=created_at-interval '2 hours' where request_id=request;
 perform public.guardian_start_verification(rec,'parent@example.test',encode(sha256('222222'::bytea),'hex'));
 ses:=encode(sha256('session-2'::bytea),'hex');
 perform public.guardian_verify_code(rec,encode(sha256('222222'::bytea),'hex'),ses);
 if public.guardian_signed_copy(rec,ses)->'waiver'->>'signatureName'<>'Jordan Parent' then raise exception 'Signed copy unavailable'; end if;
 if public.guardian_signed_copy(rec,repeat('f',64)) is not null then raise exception 'Copy without session'; end if;
 perform public.guardian_withdraw(rec,ses,'Changing plans');
 perform set_config('request.jwt.claim.role','authenticated',true);
 if registration_private.waiver_complete(tid,minor) then raise exception 'Withdrawn signature still counted'; end if;
 if public.get_my_guardian_status(tid)->>'trip'<>'withdrawn' then raise exception 'Withdrawn status wrong'; end if;

 -- Returning, previously verified guardian: new signing is accepted without a repeat review.
 tok:=encode(sha256('same-device-2'::bytea),'hex');
 request:=(public.guardian_open_request(tok,'same_device',tid)->>'requestId')::uuid;
 perform set_config('request.jwt.claim.role','service_role',true);
 perform public.guardian_start_verification(tok,'parent@example.test',encode(sha256('333333'::bytea),'hex'));
 ses:=encode(sha256('session-3'::bytea),'hex');
 perform public.guardian_verify_code(tok,encode(sha256('333333'::bytea),'hex'),ses);
 result:=public.guardian_get_request(tok,ses);
 if result->'prefill'->'participant'->>'address' is null or result->'guardian'->>'name'<>'Jordan Parent' then raise exception 'Returning guardian not prefilled %',result; end if;
 result:=public.guardian_sign(tok,ses,encode(sha256('record-2'::bytea),'hex'),payload||'{"guardian":{"name":"Jordan Parent","relationship":"Mother","phone":"702-555-0199","authority":true}}');
 if not (result->>'autoApproved')::boolean then raise exception 'Verified guardian was reviewed again'; end if;
 perform set_config('request.jwt.claim.role','authenticated',true);
 if not registration_private.waiver_complete(tid,minor) then raise exception 'Auto-approved signature did not count'; end if;
 if (select phone from public.guardian_contacts where participant_id=minor and superseded_at is null)<>'702-555-0199' then raise exception 'Phone not updated in place'; end if;

 -- A different guardian always needs a new officer review.
 perform public.withdraw_annual_waiver(registration_private.annual_signature(waiver,minor,current_date,current_date));
 tok:=encode(sha256('invite-3'::bytea),'hex');
 result:=public.guardian_prepare_invite(tok,'{"name":"Sam Guardian","email":"sam@example.test","relationship":"Legal guardian"}',tid);
 if result->>'email'<>'sam@example.test' then raise exception 'Invite contact wrong'; end if;
 begin perform public.guardian_prepare_invite(encode(sha256('invite-4'::bytea),'hex'),'{"name":"Sam Guardian","email":"sam@example.test","relationship":"Legal guardian"}',tid); raise exception 'INVITE_SPAM';
 exception when others then if sqlerrm not like 'An invitation was just sent%' then raise; end if; end;
 if public.get_my_guardian_status(tid)->>'trip'<>'waiting_for_guardian' then raise exception 'Waiting status wrong'; end if;
 if not 'Waiting for your guardian to sign.'=any(registration_private.eligibility(tid,minor)) then raise exception 'Waiting reason missing'; end if;
 perform set_config('request.jwt.claim.role','service_role',true);
 perform public.guardian_start_verification(tok,'sam@example.test',encode(sha256('444444'::bytea),'hex'));
 ses:=encode(sha256('session-4'::bytea),'hex');
 perform public.guardian_verify_code(tok,encode(sha256('444444'::bytea),'hex'),ses);
 result:=public.guardian_sign(tok,ses,encode(sha256('record-3'::bytea),'hex'),payload||'{"signatureName":"Sam Guardian","guardian":{"name":"Sam Guardian","relationship":"Legal guardian","phone":"702-555-0111","authority":true,"special":true,"specialNote":"Court-appointed"}}');
 if (result->>'autoApproved')::boolean then raise exception 'New guardian auto-approved'; end if;
 perform set_config('request.jwt.claim.role','authenticated',true);
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 result:=public.get_guardian_review_queue()->'requests'->0;
 if not (result->>'specialArrangement')::boolean or not (result->'guardian'->>'guardianChanged')::boolean then raise exception 'Guardian change not flagged %',result; end if;
 if (select count(*) from public.guardian_contacts where participant_id=minor and superseded_at is null)<>1 then raise exception 'More than one active guardian'; end if;
 begin update public.guardian_contacts set full_name='Rewritten' where participant_id=minor; raise exception 'IDENTITY_REWRITE';
 exception when others then if sqlerrm not like 'Guardian identity details are immutable%' then raise; end if; end;
 -- Legacy paper path: an officer-verified guardian document still counts without an e-signature review.
 perform set_config('request.jwt.claim.sub',stranger::text,true);
 update public.account_age_declarations set is_18_or_older=false where user_id=stranger;
 perform public.request_annual_guardian_review(waiver);
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.verify_annual_guardian(waiver,stranger,jsonb_build_object('evidence','Verified identity, authority, signature and form.',
  'guardianDocument',jsonb_build_object('guardianName','Paper Parent','signedOn',registration_private.waiver_today(),'reference','Restricted cabinet 4','verified',true)));
 if not registration_private.waiver_complete(tid,stranger) then raise exception 'Legacy officer-verified guardian document no longer counts'; end if;
 -- Membership permission and activity waiver are separate records signed in one sitting.
 insert into auth.users(id,email) values(member_minor,'member-minor@example.test');
 insert into public.membership_applications(user_id,full_name,contact_email,age_status,guardian_consent,primary_interest,status)
 values(member_minor,'Member Minor','member-minor@example.test','minor','pending','Hiking','submitted');
 perform set_config('request.jwt.claim.sub',member_minor::text,true);
 if public.get_my_guardian_status(null)->>'membership'<>'needs_signature' then raise exception 'Membership consent not requested'; end if;
 tok:=encode(sha256('membership-token'::bytea),'hex');
 request:=(public.guardian_open_request(tok,'same_device',null)->>'requestId')::uuid;
 perform set_config('request.jwt.claim.role','service_role',true);
 result:=public.guardian_get_request(tok,null);
 if result->'membership'->>'body' not like '%membership only%' or result->'waiver' is null then raise exception 'Combined request missing a document %',result; end if;
 perform public.guardian_start_verification(tok,'casey@example.test',encode(sha256('555555'::bytea),'hex'));
 ses:=encode(sha256('session-5'::bytea),'hex');
 perform public.guardian_verify_code(tok,encode(sha256('555555'::bytea),'hex'),ses);
 begin perform public.guardian_sign(tok,ses,encode(sha256('record-5'::bytea),'hex'),payload||'{"signatureName":"Casey Parent","guardian":{"name":"Casey Parent","relationship":"Father","phone":"702-555-0122","authority":true}}'); raise exception 'NO_MEMBERSHIP_AGREE';
 exception when others then if sqlerrm<>'Agree to the membership permission.' then raise; end if; end;
 perform public.guardian_sign(tok,ses,encode(sha256('record-5'::bytea),'hex'),payload||'{"membershipAgreed":true,"signatureName":"Casey Parent","guardian":{"name":"Casey Parent","relationship":"Father","phone":"702-555-0122","authority":true}}');
 perform set_config('request.jwt.claim.role','authenticated',true);
 if public.get_my_guardian_status(null)->>'membership'<>'awaiting_review' then raise exception 'Membership not awaiting review'; end if;
 if (select guardian_consent from public.membership_applications where user_id=member_minor)<>'pending' then raise exception 'Signing alone confirmed membership'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.review_guardian_request(request,'approved',null,false);
 if (select guardian_consent from public.membership_applications where user_id=member_minor)<>'confirmed' then raise exception 'Approval did not confirm membership consent'; end if;
 if (select count(*) from public.guardian_consents where request_id=request)<>1 or not exists(select 1 from public.registration_signatures s join public.guardian_requests q on q.signature_id=s.id where q.id=request)
 then raise exception 'Expected separate membership and waiver records'; end if;
 if (select officer_verified_at from public.guardian_contacts where participant_id=member_minor and superseded_at is null) is not null then raise exception 'Approval without identity check marked guardian verified'; end if;
 begin delete from public.guardian_reviews; raise exception 'REVIEW_DELETE';
 exception when others then if sqlerrm not like 'Signed documents%' then raise; end if; end;
 raise notice 'Guardian consent: verification, review gate, reuse, withdrawal, returning guardian and guardian change verified';
end $$;
rollback;
