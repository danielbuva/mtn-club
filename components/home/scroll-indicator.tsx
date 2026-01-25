import { ArrowDown } from 'lucide-react'

type ScrollIndicatorProps = {
  onClick: () => void
}

export function ScrollIndicator({ onClick }: ScrollIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-foreground/30 bg-background/70 text-foreground/80 shadow-sm backdrop-blur-sm transition hover:border-foreground/60 hover:text-foreground"
      aria-label="Scroll to membership section"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  )
}
