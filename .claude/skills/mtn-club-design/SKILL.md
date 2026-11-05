---
name: mtn-club-design
description: Brand and design rules for UNLV Mountain Club UI and email. Load before designing or restyling any page, component, or email in this repo (auth emails, trip notifications, landing pages), and before reviewing design work.
---

# UNLV Mountain Club design

## Brand system

| Token | Hex | Use |
|---|---|---|
| paper | `#F8F1DF` | page/email background, light surfaces |
| card | `#FFFCF4` | raised light surface (never pure `#FFF`) |
| ink | `#211D18` | text, dark panels, primary buttons (never pure `#000`) |
| muted | `#6A5146` | eyebrows, labels, fine print (AA on paper and card) |
| rule | `#E3D6BA` | hairline dividers and borders |
| highlight | `#FFECA2` | text on ink (dates, CTAs, links), status tags on light |
| red | `#D40000` | the club badge and one accent rule per view; never body text |

- Display type: **Archivo Narrow 700, uppercase**, tight leading (headlines like "GET OUTSIDE THIS SEMESTER."). Eyebrows: same face, 13px, 2px tracking, muted.
- Body type: Geist on the site; `Helvetica, Arial, sans-serif` in email. 16px/26px.
- Shape: square corners, hairline borders, editorial grids. No soft shadows, no gradients, no pill buttons.
- Voice: short, warm, outdoorsy, plain. Headline states the outcome ("You're going."), body says what to do next. No exclamation marks in security mail.
- Marks: the red badge (`public/email/club-badge-v1.png`, email only) is the official logo; the outlined arched wordmark (`components/unlv-mountain-club.tsx`) is the site's editorial mark; Lucide `Mountain` is the small UI glyph. Don't combine more than one in a view.

## Email craft (from Litmus, caniemail, Gmail CSS docs, goodemailcode)

Code lives in `lib/email/` — `theme.ts` (tokens), `blocks.ts` (paragraph, button, secondaryButton, codeBlock, callout, details, statusTag, image, notice, storyList, linkFallback), `layout.ts` (shell).
- Supabase Auth: `auth-templates.ts` (signup, recovery, code, password changed) and `account-templates.ts` (invite, email change, reauthentication, security notices).
- Trip notifications: `lib/registration/email.ts` + `email-copy.ts` (one entry per notification kind: heading, message, status tone, action).
- Broadcasts: `announcement.ts` (news, trip, digest, alert) and `resend-templates.ts` (Resend dashboard templates with `{{{VARS}}}`).
- Run `node scripts/build-auth-emails.ts` to regenerate `supabase/templates/` and `docs/email/resend/`; tests run it with `--check`.

- Tables with `role="presentation"`, 600px max container, MSO ghost table for Outlook. All essential styles inline; `<style>` only for dark mode and enhancements (Gmail drops the whole block on one syntax error).
- Px line-heights plus `mso-line-height-rule:exactly`; MSO font override to Arial.
- Web fonts are progressive enhancement (Apple Mail, iOS, Outlook Mac). Gmail falls back to Arial Narrow/Helvetica; check that the fallback still looks intentional.
- One primary CTA per email: ink button, highlight label, with a VML version for Outlook. Under it, put a plain fallback URL for auth links.
- Preheader: hidden, adds to the subject rather than repeating it, followed by filler characters.
- OTP: monospace, letter-spacing (not spaces), `user-select:all`, a single text node.
- Dark mode: `color-scheme` meta, `prefers-color-scheme` overrides, and `[data-ogsc]`/`[data-ogsb]` for Outlook.com. The badge is a transparent PNG with a self-contained red shape, so it survives inversion. Never put essential text only in an image.
- Images: absolute HTTPS URLs, 2–3× export, explicit `width`, styled alt text. No SVG or data URIs.
- Footer: why the email was sent, contact, club identity. Show a preferences link only on non-essential mail. Keep HTML under 60KB (Gmail clips around 102KB).
- Accessibility: `lang`, one `h1`, 16px body, 13px minimum fine print, underlined links, status in words (not color alone), 44px+ tap targets.

## Review checklist
1. Render it at 390px and 680px, in light and dark (Playwright `colorScheme`).
2. Check it with images off: does the alt text and the copy still carry the message?
3. Check contrast for every text/background pair in both themes (AA 4.5:1; 3:1 for 18px+ bold).
4. Ask a separate critic agent for a design-only review before you ship.
