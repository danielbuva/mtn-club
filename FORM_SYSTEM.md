# MTN Club form language

Shared interaction language, bespoke flows. Trip creation optimizes for organizer speed; registration optimizes for participant clarity and confidence. Onboarding is deferred.

## Composition

`components/forms` provides independently composable pieces:

- `FormShell`: semantic form, hydration readiness, narrow layout.
- `FormProgress`: a bar based on the currently active path, without a fixed step denominator.
- `FormViewport`: brief transitions, reduced-motion support, and heading focus after navigation.
- `FormStep`: one decision or a related group with contextual copy.
- `FormActions`: navigation and pending states; inline or sticky when the visible viewport has enough room. Visual viewport and content measurements drive placement, rather than a keyboard-open flag.
- `ChoiceCards`, `TextField`, `TextAreaField`, `DateTimeField`, `ToggleField`, and `NumberStepper`: labelled, explicit-prop controls independent of React Hook Form.

Flows own their schema, state, sequence, validation, branching, copy, and persistence adapters. Compose these components directly; do not add a configuration-driven universal question renderer. Build new primitives only when real flows establish a shared need.

Continue is explicit. Back preserves answers. Validation focuses the first invalid field, and navigation focuses the new heading without opening the keyboard. Long reading/writing and review screens use inline actions. Server updates preserve dirty registration fields while refreshing eligibility and requirements; changed waiver requirements clear transient consent.

## Integrations

Trip creation uses five groups: Basics, When & where, Trip details, Settings, Review. Related fields may share columns on desktop. Drafts include transportation collection, hosts, and leaders. Dates round-trip in the selected timezone, including across browser/server timezone differences. Existing compact admin editing stays compact.

Registration derives its active steps from the participant and trip requirements. Different participants can see different numbers of questions. `normalizeRegistrationValues()` is the single boundary for draft saves, registration, and updates. Branch-hidden values can remain in transient UI state; normalization strips inactive answers before persistence. Drafts never submit signatures or consent. Disabling transportation omits the field, preserving previously collected answers; explicitly skipping while enabled submits `null`.

Transportation preferences are optional and are not a carpool matching feature:

```ts
type TransportationResponse =
  | { mode: 'driver'; seatsOffered: number }
  | { mode: 'needs_ride' }
  | { mode: 'self_arranged' }
  | null
```

Seats are available passenger seats, excluding the driver (1–8). User-facing copy remains “I've got a ride.” Preferences are visible to the participant and authorized organizers through the roster/export, not publicly. Matching, departure points, driver assignment, and messaging remain separate future work.

## Joining preferences and declarations

The joining flow includes the trip’s configured waiver, a preferences step, and an age declaration only when the account has none. Waiver signatures remain tied to the current document version; previously signed versions show their status, and minors retain the guardian-verification path. The normal showroom demonstrates an unsigned waiver and a first-time declaration.

Attendee visibility defaults off for accounts without a saved choice. Confirmation saves a per-trip flag and the default for future signups. Changing a later trip does not rewrite earlier trip flags. Hidden people still count toward capacity and remain visible in the authorized organizer roster. Attendee lists filter profiles on the server; existing directory privacy also applies.

The email choice updates only the existing account-wide trip-update category and legacy gate. It never enables marketing categories or overrides the master email switch. Existing saved email choices prefill the control. Account Privacy settings remain authoritative. Preference writes and registration commit atomically, check stale defaults, and retain idempotent retries. Drafts do not record these opt-ins; the UI explains that they are saved on confirmation.

The saved age declaration and date appear in Account settings. It is not asked again on later trips; corrections go through a club officer. The showroom remembers these choices only until reload and does not change real account settings.

## Human showroom

Open `/form-lab` in development or a Vercel preview. It is unavailable in production and has noindex metadata. Creation and registration use the real flow components with simulated saves. Inspect normal flows, branches, validation, loading/retry, longer content, transportation on/off, and the small field gallery. Fixtures never write real registrations or trips.

Keep this a human inspection surface; domain permutations belong in automated tests and the actual RSVP route.

## Database rollout

Apply `supabase/migrations/202609040022_transportation_preferences.sql` before deploying the application changes. It extends drafts, registration settings, and responses; updates validated command/snapshot/roster/merge handling; and adds the authorized transportation-setting RPC. It does not enable collection for existing trips. The validator includes explicit execution grants for existing database-function owners.

Also apply `supabase/migrations/202609050001_joining_preferences.sql` for per-trip attendee visibility, remembered defaults, and transactional email choices. Existing attendee records are hidden until their participant opts in.

The local sandbox and remote staging project `qarabfhyyekjqmzsuhzo` have all four form migrations applied as of September 5, 2026. Remote database function lint reports no errors. Production migration/deployment remains a separate `main` release.

## Verification

- `pnpm test`: unit and repository regression tests.
- `pnpm exec tsc --noEmit`: type validation.
- `pnpm test:registration:db`: disposable database reconstructed from migrations; requires the local Supabase sandbox described in RSVP_RUNBOOK.md.
- `pnpm test:forms:browser`: mobile/desktop showroom journeys, branching, normalization, validation focus, recovery, narrow viewport, keyboard navigation, and screenshots.
- `pnpm test:registration:browser`: authenticated registration, guardian/waitlist behavior, organizer draft resume/publication, and trip lifecycle.
- `pnpm build`: production compilation.

Browser tests use the fixed local integration sandbox and port 3140, never a production database. Run the browser suites sequentially because they share the test server. Screenshots are written to Playwright's `test-results` directory. Viewport emulation checks layout behavior; physical iOS/Android keyboard and screen-reader checks remain release QA.

## Waiver reading view

The full, unmodified waiver opens in a native modal dialog: full-screen on mobile, contained on desktop. Its document scrolls independently with keyboard access and body scroll locking. Closing early leaves signing locked. Reaching the end and closing unlocks the existing signature fields; this transient state is retained across Back navigation and reset for a new waiver. It is neither consent nor persisted signing evidence. The explicit agreement, signature, and final registration submission still record acceptance. Already signed waivers remain available to reread.

## Port audit and input parity

The live `/trips/new`, `/admin/trips/new`, and `/calendar/new` entry points use `TripCreationFlow`. `/trips/[tripId]/rsvp` uses `RegistrationFlow` with the server's current registration snapshot. The showroom is never imported into live routes. The unused original creation sections and registration field renderer have been removed; compact trip editing and organizer registration settings remain conventional forms.

| Original input or behavior | Port location / persistence |
| --- | --- |
| Official/community, title, summary, activities and activity management | Basics; original trip fields and shared tag options |
| Difficulty | Trip details; original difficulty enum |
| Start/end and timezone | When & where; timezone-correct instants; specified times no longer publish as TBA |
| Destination, meeting point, private meeting notes | When & where; public destination, meeting point plus route notes in Where, private meetup instructions |
| What, weather, equipment, carpool/gear notes | Trip details; corresponding original overview columns |
| Visibility and optional participant limit | Settings; original visibility and capacity, with unlimited normalized to null |
| Public hosts and linked account leaders | Settings; draft selections and published assignments, including the public host’s credited title |
| Save/resume draft, publish, cancel | Shared actions with live server adapters and page-load retry screens |
| Text, single-choice, multi-choice and yes/no registration questions | Dedicated guided steps; original question IDs and answer types |
| Emergency name, relationship, phone and notes; current-contact confirmation | Emergency Contact; original private contact payload |
| Waiver agreement, typed name, seven initials, phone, local address, emergency address and birth date | Waiver reader followed by signing; exact configured document/version and signer details |
| Age declaration and guardian review | Saved account declaration and original guardian-verification workflow |
| Waitlist, seat offers, cancellation, saved signup and response updates | Existing registration commands and status controls |

Additional features remain: transportation preferences, per-trip attendee visibility, account email preferences, and persisted event type. Apply `202609050002_trip_form_parity.sql` and `202609050003_trip_activity_option_access.sql` after the preceding form migrations. The latter aligns activity-option access with the app: authenticated accounts can read choices, while mutations require the existing `trips.update` capability.

Authenticated browser coverage now fills and checks organizer values through draft reload and publication, tests community drafts through the calendar alias, exercises every custom-question control, and compares the signed document to the complete real UNLV template. It checks the stored source URL, signature, seven initials, and signer details. Real trips use the organizer-configured immutable waiver; no preview wording or invented risk descriptions are injected into live waivers. Official-trip organizers still complete the existing template picker with actual event risks before enabling registration.

Onboarding remains explicitly deferred. The `staging` branch deploys to the protected Vercel preview backed by `qarabfhyyekjqmzsuhzo`. Production remains a separate `main` release. Physical-device keyboard and screen-reader checks remain manual release QA; automated mobile/desktop checks, authenticated journeys, database tests, type checks, formatting, and the production build pass.
