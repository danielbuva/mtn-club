import { CheckoutButton } from './checkout-button'

type MembershipFinalCTAProps = {
  title: string
  description: string
  ctaLabel: string
}

export function MembershipFinalCTA({ title, description, ctaLabel }: MembershipFinalCTAProps) {
  return (
    <section className="py-24 px-4 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{title}</h2>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">{description}</p>
        <CheckoutButton
          label={ctaLabel}
          size="lg"
          variant="secondary"
          className="rounded-xl text-lg px-8 gap-2"
        />
      </div>
    </section>
  )
}
