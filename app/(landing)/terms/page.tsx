import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '@/components/landing/public-shell'
import { CLUB_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service | UNLV Mountain Club',
  description:
    'Terms for using the UNLV Mountain Club website, managing your account, and participating in our community.',
  alternates: { canonical: '/terms' },
}

const sections = [
  {
    title: 'About these terms',
    paragraphs: [
      'These terms govern your use of the UNLV Mountain Club website and its account, membership, and activity-coordination features. “We,” “us,” and “the club” mean UNLV Mountain Club, an independent, student-run organization—not the University of Nevada, Las Vegas. Our activities and statements are not affiliated with or endorsed by UNLV.',
      'By using the site, you agree to these terms to the extent permitted by applicable law. If you do not agree, please stop using the site. These terms do not replace the club’s constitution, applicable university or venue rules, or a separate agreement you are asked to accept for an activity.',
    ],
  },
  {
    title: 'Accounts and eligibility',
    paragraphs: [
      'Provide accurate information, keep your contact details current, and protect your sign-in credentials. Do not impersonate another person, share access to a restricted account, or use someone else’s account without authorization. Tell us promptly if you suspect unauthorized access.',
      'Creating an account does not by itself confirm paid membership or eligibility for a particular activity. Membership requires leadership review and confirmation. Applicants under 18 need parent or guardian consent before membership access is granted, and activities may have additional age, skill, equipment, or consent requirements. Contact us before registering if you are unsure whether you are eligible.',
    ],
  },
  {
    title: 'Respect the community and the site',
    paragraphs: [
      'Treat members, organizers, and others respectfully. Do not use the site for harassment, threats, discrimination, fraud, spam, unlawful activity, or sharing another person’s private information without permission.',
      'Do not bypass access controls, misuse member information, introduce malicious software, or interfere with the site’s operation. Follow reasonable organizer instructions, land-use restrictions, venue rules, and applicable laws when participating in activities.',
    ],
  },
  {
    title: 'Membership, dues, and refunds',
    paragraphs: [
      'Open community participation and club weekly meetups are free; venues and individual activities may charge their own fees. Paid annual membership is separate. Current dues, the membership term, and payment instructions are listed on our Costs & Dues and membership pages. Use only the club’s published payment instructions. Leadership verifies payments before confirming full membership access.',
      'Membership does not guarantee a place on every trip, access to particular equipment, transportation, or admission to a third-party venue. Check each activity’s requirements, availability, and additional costs before committing. Any future change to dues will be disclosed before a new payment is requested and will not retroactively change a completed purchase.',
      'For a mistaken or duplicate payment, a cancellation, or another refund request, contact the club promptly with the payment date and relevant details. Leadership will review the request based on the circumstances, any specific terms disclosed before payment, and applicable law. These terms do not impose a blanket no-refund rule or limit refund rights that cannot lawfully be waived. Third-party payments are handled under that provider’s terms.',
    ],
  },
  {
    title: 'Trips, changes, and outdoor safety',
    paragraphs: [
      'Trip listings are planning information, not a guarantee that an activity will take place. Weather, closures, group capacity, organizer availability, and safety concerns may require changes or cancellations. Confirm the latest arrangements with the organizer before traveling or incurring costs. Informal member-arranged outings are not automatically club-organized events.',
      'Climbing, hiking, camping, travel, and other outdoor activities involve risks, including serious injury, illness, property loss, or death. Conditions can change quickly and emergency assistance may be delayed. Consider your abilities and health, use suitable equipment, and seek qualified instruction when needed. Website information is not professional guiding, medical advice, or a substitute for training and your own assessment of conditions.',
      'Participation is voluntary. Do not join or continue an activity you believe is unsafe or beyond your abilities. Complete any separately required activity waiver or consent form. These website terms are not a liability waiver and do not release anyone from responsibility for injury or misconduct. In an emergency, contact emergency services; the site and club inbox are not emergency-response channels.',
    ],
  },
  {
    title: 'Photos, posts, and other content',
    paragraphs: [
      'Only submit material you own or have permission to share, including any necessary permission from people pictured or identified. You retain ownership of your content. By submitting it for use on the site, you give the club a non-exclusive permission to store, format, and display it as needed for the purpose for which you submitted it, subject to your privacy settings and our privacy policy. This is not permission to sell your content or use it for unrelated advertising.',
      'We may remove material that violates these terms, infringes others’ rights, or creates a safety or privacy concern. Contact us about an unwanted photo, inaccurate information, or a rights complaint. Please identify the material and explain your concern.',
      'Club and third-party photos, logos, and written materials remain the property of their respective owners. You may use the site for personal, noncommercial club-related purposes; ask the relevant owner before republishing content or using branding in a way that suggests endorsement.',
    ],
  },
  {
    title: 'Privacy and third-party services',
    paragraphs: [
      'Our privacy policy explains how we handle account information, including basic profile data received through Google sign-in. Signing in with Google does not give us your Google password or permission to access your Gmail, Drive, or Calendar.',
      'The site may link to or use third-party services, such as Google, Discord, Instagram, payment services, and activity venues. Their own terms and privacy policies apply to your use of those services. We do not control their availability, content, or practices. A link does not by itself imply endorsement.',
    ],
  },
  {
    title: 'Site availability and account restrictions',
    paragraphs: [
      'We aim to keep information accurate and the site useful, but it may contain errors or experience interruptions. To the extent permitted by law, the website is provided “as is” and “as available,” without a guarantee of uninterrupted or error-free operation. Verify important trip and payment details with leadership. This statement does not remove rights or guarantees that applicable law does not allow us to exclude.',
      'We may limit or suspend site access to address a security threat, suspected misuse, or a violation of these terms. Where reasonably practicable, we will explain the restriction and provide a way to contact leadership for review. Urgent safety or security action may happen without advance notice. An access restriction does not automatically determine a refund request or override any applicable club membership-review process.',
      'You may stop using the site at any time and contact us to request account closure or deletion of personal information as described in the privacy policy.',
    ],
  },
  {
    title: 'Changes and resolving concerns',
    paragraphs: [
      'We may update these terms as the site or club services change. We will post the revised terms and effective date here and give reasonable notice of material changes through the site or account contact details. Changes apply prospectively; where the law requires your agreement, we will seek it before applying those changes to you.',
      'Please contact leadership first if you have a concern so we can try to resolve it. These terms do not require arbitration, waive class actions, or take away access to courts or other remedies available under applicable law. If a provision cannot be enforced, the remaining provisions continue to apply to the extent permitted by law.',
    ],
  },
]

const linkClass =
  'underline underline-offset-4 outline-none transition hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-current'

export default function TermsPage() {
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
            Terms of service
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#6A5146]">
            A few ground rules for using our site, joining the community, and
            planning time outside together.
          </p>
          <p className="mt-5 text-xs text-[#6A5146]">
            Effective <time dateTime="2026-09-03">September 3, 2026</time>
          </p>
          <nav
            aria-label="Related policies"
            className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6A5146]"
          >
            <Link href="/privacy" className={linkClass}>
              Privacy policy
            </Link>
            <Link href="/cost" className={linkClass}>
              Costs &amp; dues
            </Link>
            <Link href="/safety" className={linkClass}>
              Safety guide
            </Link>
          </nav>
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
              Get in touch
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6A5146] sm:text-base">
              Questions about these terms, membership, or a concern with the
              site? Email club leadership at{' '}
              <a href={`mailto:${CLUB_EMAIL}`} className={linkClass}>
                {CLUB_EMAIL}
              </a>
              . Please do not send passwords or full financial account details.
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  )
}
