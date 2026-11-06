# Annual UNLV waiver and trip-informed-risk rollout

UNLV's [RSO Liability Waiver FAQ](https://www.unlv.edu/sites/default/files/media/document/2023-10/RSO-Liability-Waiver-FAQs-Sept2023.pdf), questions 7–8, permits specifically identified recurring activities during July 1–June 30. It does not permit a blanket waiver. The original August 2022 template remains unchanged in `lib/registration/unlv-waiver.ts` and `public/legal/unlv-rso-waiver-template-2022.docx`.

## Configure reviewed content

1. Apply migrations `202609050005`–`202609050009` before deploying the matching app. No new environment variables are needed. Verify the target Supabase project against the intended Vercel environment, not a differently configured local environment.
2. In Admin → Registration operations, enter the designated Event, Sponsor, activity-specific risks/possible injuries, July 1 start date, and specifically enumerated activities. Name those activities in the Event or risk field, as well as the coverage list. The Date of Event is generated as an explicit July–June range.
3. Save a draft. Review the generated UNLV document and the proposed activity scope/risk language with UNLV. Saving a draft does not make it signable. This release does **not** seed or publish supposedly approved legal content.
4. Publish the reviewed document with a review reference. Publication creates a separate permanent record. The latest published version for a given academic year requires a fresh signature. To replace wording, save another draft; never modify a stored document.
5. For each upcoming trip, use its Informed risks editor to identify all activities and supply roughly 1–3 concise statements about actual trip conditions. No risk text or activity classification is invented automatically. A missing disclosure prevents a new registration; an out-of-scope trip never becomes participation-ready using the annual waiver. Contact an officer for the separate activity process.

New trips use the annual model. Existing trips retain their legacy waiver assignment until an organizer saves their Informed risks and activity classification; this prevents the database rollout from disrupting an already-open registration before reviewed annual content is available. Completed trips retain their legacy per-trip records. Existing RSVPs are preserved. Upcoming participants may need to acknowledge risks and sign a reviewed annual document before participation. Leaders see these requirements in the roster; marking attendance as present requires readiness. Keep registration's existing global/pilot switches under the release process in `RSVP_RUNBOOK.md`.

## Records and withdrawal

`registration_waivers` contains immutable annual documents (null `trip_id`), July–June dates, enumerated activities, exact template provenance and filled values. `registration_signatures` retains typed signatures, authenticated account/email, server time, seven initials, participant/contact details, and exact document reference. Annual records have signature coverage dates; legacy records remain unchanged.

`registration_waiver_withdrawals` appends the withdrawal timestamp and actor without modifying the original signature. Signing again creates a new record. Duplicate requests return the existing result; account locks serialize concurrent devices and merges. Merges preserve original signature and acknowledgement ownership, resolved through the existing account-merge ledger. There is no destructive cleanup.

`registration_risk_disclosures` and `registration_risk_acknowledgements` retain exact text, activities, revision, owner and timestamp. Whitespace-only changes are normalized. All other wording or scope changes require renewed acknowledgement. Completed trip disclosures cannot be edited. Annual coverage for past trips is evaluated against publication and withdrawal times at the trip start.

## Guardian process

Migration `20261107010001_guardian_consent.sql` adds electronic guardian consent. Apply it before deploying the matching app.

- **Who signs:** a minor opens Guardian permission (trip RSVP page or Profile → Guardian permission) and either hands over their device ("They're with me", a 2-hour link) or emails their guardian a 14-day link. Guardians never create an account.
- **Verification:** the guardian confirms their email with a 6-digit code (10-minute expiry, 5 tries, 45-second resend cooldown, 5 codes per hour). This proves inbox access only and is labeled that way everywhere; it is not an identity check. The guardian's email cannot be the participant's.
- **What is signed:** membership permission (frozen text, `guardian_consents`) and/or the current annual waiver (`registration_signatures`, `signer_kind='guardian'`) with seven initials, participant birth date and address, emergency contact, an authority declaration, and an optional shared/limited/court-ordered flag. Coverage ends at the waiver's June 30 or the day before the participant turns 18, whichever is first.
- **Approval gate:** an electronic guardian signature counts only after an officer approves it in Admin → Membership → Guardian consent. If an officer previously checked the same, unchanged guardian's identity and authority ("I also checked…"), later signatures are accepted automatically unless the guardian flags a special arrangement. Changing the guardian's name, email, or relationship creates a new guardian record that needs its own review. Approving a membership permission confirms `membership_applications.guardian_consent` and runs the existing activation rules.
- **Reuse:** an approved, unwithdrawn signature for the published annual version covers every in-scope trip in its period. No new request is created for covered trips.
- **Records:** consents, reviews and signatures are append-only; guardian identity fields are immutable; tokens, codes and sessions are stored only as SHA-256 hashes. Guardians get a long-lived record link to download a copy or withdraw (each behind a fresh code). Withdrawal stops the waiver counting immediately and appears in the officer queue.
- **Paper/assisted path:** the earlier officer verification of a guardian-signed paper document remains available on the same admin page and keeps counting.
- **Email:** guardian codes and invitations are sent immediately through Resend using `REGISTRATION_RESEND_API_KEY` and `REGISTRATION_EMAIL_FROM` (independent of `REGISTRATION_EMAIL_ENABLED`), with links built from `NEXT_PUBLIC_SITE_URL`. Without them, guardians see an actionable error; in local development, messages are logged to the server console.
- **Release dependency:** confirm the custom guardian e-signing and verification process with UNLV RSO administration or risk management before describing it as UNLV-approved.

## Verification

- `pnpm test`: existing unit and form-normalization checks.
- `pnpm test:registration:db`: disposable PostgreSQL reconstruction, guardian e-signing (`tests/guardian-consent.sql`), legacy migrations, permission boundaries, first/returning adult trips, proactive signing, concurrent devices, duplicate requests, withdrawal and re-signing, replacement, risk revisions, scope, future academic-year expiry, guardian reuse, account merge and historical record integrity.
- `pnpm test:forms:browser`: mobile and desktop signing/reader, first annual trip, returning participant skipping signature, deliberately unchecked risk acknowledgement, creation steps and error recovery.
- `pnpm build` and `pnpm check`: production compilation/types and formatting/lint.

Never run synthetic participation fixtures against production members. Deploy the architecture with draft content until reviewed fields are available. Publishing reviewed content is a separate explicit administrator action in the app.
