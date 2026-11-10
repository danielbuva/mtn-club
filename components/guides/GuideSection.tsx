import { cn } from '@/lib/utils'

type GuideSectionProps = {
  id: string
  children: React.ReactNode
  className?: string
}

export function GuideSection({ id, children, className }: GuideSectionProps) {
  return (
    <section className={cn('border-t border-border', className)}>
      <span
        id={id}
        data-toc-anchor=""
        aria-hidden="true"
        className="block h-px scroll-mt-20"
      />
      <div className="py-7 md:py-9">{children}</div>
    </section>
  )
}
