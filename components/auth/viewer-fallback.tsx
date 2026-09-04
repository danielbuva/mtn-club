import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'

export function ViewerFallback() {
  return (
    <div className="min-h-screen" aria-busy="true">
      <div
        className="hidden h-16 border-b border-border bg-background md:block"
        aria-hidden="true"
      />
      <div className="md:hidden">
        <ThumbNavigationBar
          tone="paper"
          placement="right"
          className="gap-0 rounded-none"
          showTheme={false}
        >
          <span
            className="block size-11 animate-pulse bg-[#211D18]/80"
            aria-hidden="true"
          />
          <span className="sr-only">Loading navigation</span>
        </ThumbNavigationBar>
      </div>
    </div>
  )
}
