import { cn } from '@/lib/utils'

type GuideSectionProps = {
  id: string
  children: React.ReactNode
  className?: string
}

export function GuideSection({ id, children, className }: GuideSectionProps) {
  return (
    <section
      className={cn('border-t border-border/20 first:border-t-0', className)}
    >
      <span
        id={id}
        data-toc-anchor=""
        aria-hidden="true"
        className="block h-px scroll-mt-20"
      />
      <div className="py-12 md:py-20">{children}</div>
    </section>
  )
}
