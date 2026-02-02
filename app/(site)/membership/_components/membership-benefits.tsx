import { Card } from '@/components/ui/card'
import type { MembershipBenefit } from './membership-data'

type MembershipBenefitsProps = {
  eyebrow: string
  title: string
  description: string
  benefits: MembershipBenefit[]
}

export function MembershipBenefits({
  eyebrow,
  title,
  description,
  benefits,
}: MembershipBenefitsProps) {
  return (
    <section id="benefits" className="py-24 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            {eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(benefit => (
            <Card
              key={benefit.title}
              className="p-6 bg-card border-border/50 hover:border-primary/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
