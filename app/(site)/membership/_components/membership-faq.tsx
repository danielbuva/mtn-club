import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { MembershipFaq } from './membership-data'

type MembershipFaqProps = {
  eyebrow: string
  title: string
  description: string
  faqs: MembershipFaq[]
}

export function MembershipFaq({ eyebrow, title, description, faqs }: MembershipFaqProps) {
  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">{eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="border border-border rounded-2xl px-6 data-[state=open]:bg-secondary/30"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
