import { MembershipBenefits } from './membership-benefits'
import { MembershipCheckoutCard } from './membership-checkout-card'
import { activateFaqs, membershipBenefits } from './membership-data'
import { MembershipFaq } from './membership-faq'
import { MembershipFinalCTA } from './membership-final-cta'
import { MembershipHero } from './membership-hero'

export function MembershipActivate() {
  return (
    <main className="flex-1 pt-16">
      <MembershipHero
        badge="Member Access"
        title="Activate Membership"
        description="Complete checkout to unlock upcoming trips, the guidebook library, and gear room access. You're already signed in. Finish activation to start RSVPing."
      />

      <section className="py-12 px-4">
        <MembershipCheckoutCard ctaLabel="Activate Membership" />
      </section>

      <MembershipBenefits
        eyebrow="Member Perks"
        title="What You Unlock"
        description="Activate your membership to start exploring trips, resources, and community perks right away."
        benefits={membershipBenefits}
      />

      <MembershipFaq
        eyebrow="FAQ"
        title="Checkout Questions"
        description="Everything you need to know before you activate membership."
        faqs={activateFaqs}
      />

      <MembershipFinalCTA
        title="Ready to Activate Your Membership?"
        description="Complete checkout once and you are set for the year. We'll send your receipt immediately."
        ctaLabel="Activate Membership"
      />
    </main>
  )
}
