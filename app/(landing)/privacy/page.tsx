import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '@/components/landing/public-shell'
import { CLUB_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy | UNLV Mountain Club',
  description:
    'How UNLV Mountain Club uses Google sign-in information and handles your account data.',
  alternates: { canonical: '/privacy' },
}

const sections = [
  {
    title: 'Information from Google sign-in',
    paragraphs: [
      'When you choose to sign in with Google, Google shares your name, email address, and profile photo (if available), along with a unique account identifier and email-verification information. We use Supabase to handle authentication and store your club account and profile.',
      'We use this information to recognize you when you sign in, create or link your club account, and fill in your profile name and photo. Your email also helps us communicate with you about your account and club participation.',
      'Google sign-in does not give us your Google password. We do not request access to your Gmail messages, Google Drive files, contacts, or Google Calendar.',
    ],
  },
  {
    title: 'Information you choose to provide',
    paragraphs: [
      'If you complete a membership form, edit your profile, sign up for a trip, or contact us, we also receive the information you submit. This may include contact details, membership information, outdoor interests, and emergency-contact or trip preferences. This information is separate from the basic information shared by Google.',
      'We use these details to manage membership, coordinate activities, support trip safety, and respond to your requests. Profile details may be visible to other members according to the site’s features and your privacy settings.',
    ],
  },
  {
    title: 'Cookies and site usage',
    paragraphs: [
      'We use authentication cookies to keep you signed in and browser storage to remember preferences such as your theme. We use Vercel Analytics to understand page visits and interactions and improve the website. Our analytics events are not intended to include your name, email, or payment details. Hosting and security services may also process technical information, such as IP addresses and request logs, to operate and protect the site.',
    ],
  },
  {
    title: 'How information is shared',
    paragraphs: [
      'We do not sell your personal information or use Google sign-in data for advertising. Service providers, including Supabase for authentication and storage and Vercel for hosting and analytics, process information needed to run the site. Google handles your Google sign-in under its own privacy policy.',
      'Authorized club officers may access information needed to manage accounts, membership, and activities. We may also disclose information when required by law or necessary to protect the safety and security of our members and services.',
    ],
  },
  {
    title: 'Your choices and data retention',
    paragraphs: [
      'You can update available profile and privacy settings from your account. To request access to, correction of, or deletion of your personal information, email the club using the address below. We may ask you to verify that the account belongs to you before completing a request.',
      'We keep information as needed to provide your account and club services. Some records may need to be retained for membership administration, security, dispute resolution, or legal obligations. Removing the club’s access in your Google Account stops future Google access but does not automatically delete information already stored in your club account.',
    ],
  },
]

const linkClass =
  'underline underline-offset-4 outline-none transition hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-current'

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="public-page-top mx-auto max-w-3xl px-5 pb-20 sm:px-8 sm:pb-24">
        <header className="border-b border-current/20 pb-8">
          <Link
            href="/welcome"
            className={`font-brand text-xs uppercase tracking-[0.2em] text-[#6A5146] ${linkClass}`}
          >
            UNLV Mountain Club
          </Link>
          <h1 className="mt-5 font-brand text-5xl leading-none uppercase tracking-tight sm:text-7xl">
            Privacy policy
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#6A5146]">
            A straightforward look at the information we use to keep our
            community connected—on the site and on the trail.
          </p>
          <p className="mt-5 text-xs text-[#6A5146]">
            Last updated <time dateTime="2026-09-03">September 3, 2026</time>
          </p>
        </header>

        <div className="divide-y divide-current/15">
          {sections.map(section => (
            <section key={section.title} className="py-8">
              <h2 className="font-brand text-2xl uppercase tracking-wide">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#6A5146] sm:text-base">
                {section.paragraphs.map(paragraph => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          <section className="pt-8">
            <h2 className="font-brand text-2xl uppercase tracking-wide">
              Questions or requests?
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6A5146] sm:text-base">
              This policy covers the UNLV Mountain Club website, operated by our
              independent, student-run club. Email{' '}
              <a href={`mailto:${CLUB_EMAIL}`} className={linkClass}>
                {CLUB_EMAIL}
              </a>{' '}
              with privacy questions or data requests. If our practices change,
              we will update this page and its revision date.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#6A5146]">
              <a
                href="https://policies.google.com/privacy"
                className={linkClass}
              >
                Google’s privacy policy
              </a>
              {' · '}
              <a
                href="https://myaccount.google.com/connections"
                className={linkClass}
              >
                Manage Google connections
              </a>
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  )
}
