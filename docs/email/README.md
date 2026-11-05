# Club emails

Every email a member can receive uses one design system (`lib/email/`). See `.claude/skills/mtn-club-design` for the rules.

| Email | Sent by | Source |
|---|---|---|
| Confirm signup, reset password, verification code, password changed | Supabase Auth | `lib/email/auth-templates.ts` → `supabase/templates/` |
| Invite, email change, reauthentication code, email changed, sign-in method added/removed | Supabase Auth | `lib/email/account-templates.ts` → `supabase/templates/` |
| Trip registration updates (12 kinds: sign-ups open, confirmed, waitlist, seat offer, canceled, changed, reminders…) | App worker via Resend API | `lib/registration/email.ts` + `email-copy.ts` |
| Club announcement, new trip, member stories, important update | Officers via Resend Broadcasts | `lib/email/resend-templates.ts` → `docs/email/resend/` |

After editing any source, run `node scripts/build-auth-emails.ts`. The tests fail if the generated files are stale. Then paste the changed Supabase templates into the Supabase dashboard, and the changed Resend templates into Resend → Templates.

## Sending a broadcast (officers)

1. In Resend, open **Templates**, pick the variant that fits, and fill in every variable. Each variant's description lists its limits.
   - Headlines: 45 characters or fewer, with no period.
   - Button labels: 22 characters or fewer.
   - Body paragraphs: separate them with `<br><br>`.
   - Photos: 1068×600 JPEG, under 200 KB.
2. Write a subject that adds to the headline instead of repeating it.
3. Choose the audience:
   - **Important update** goes only to the affected trip's attendees.
   - **Club news** goes to members who opted in.
4. Send yourself a test first, and check it on your phone in both light and dark mode.
