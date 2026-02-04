import { cn } from '@/lib/utils'

type GuideSectionProps = {
  id: string
  children: React.ReactNode
  className?: string
}

export function GuideSection({ id, children, className }: GuideSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 md:scroll-mt-24 py-12 md:py-20 border-t border-border/20 first:border-t-0',
        className,
      )}
    >
      {children}
    </section>
  )
}
