import { MembershipBenefits } from './membership-benefits'
import { MembershipCheckoutCard } from './membership-checkout-card'
import { MembershipFaq } from './membership-faq'
import { MembershipFinalCTA } from './membership-final-cta'
import { MembershipHero } from './membership-hero'
import { marketingFaqs, membershipBenefits } from './membership-data'

export function MembershipMarketing() {
  return (
    <main className="flex-1 pt-16">
      <MembershipHero
        badge="Limited Time Offer"
        title="Join Mountain Club"
        description="Unlock access to our Upcoming Events, our Guidebook Library, Gear Room, and a community of outdoor enthusiasts who share your passion."
      />

      <section className="py-12 px-4">
        <MembershipCheckoutCard ctaLabel="Checkout" />
      </section>

      <MembershipBenefits
        eyebrow="Member Perks"
        title="What You Get"
        description="Your membership unlocks a full suite of benefits designed to enhance your outdoor experience."
        benefits={membershipBenefits}
      />

      <MembershipFaq
        eyebrow="FAQ"
        title="Common Questions"
        description="Everything you need to know about becoming a member."
        faqs={marketingFaqs}
      />

      <MembershipFinalCTA
        title="Ready to Start Your Adventure?"
        description="Join 200+ members exploring the best of the West Coast. Your next adventure is waiting."
        ctaLabel="Join Now for $25/year"
      />
    </main>
  )
}
