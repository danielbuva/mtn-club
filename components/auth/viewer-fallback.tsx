import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'

export function ViewerFallback() {
  return (
    <div className="min-h-screen" aria-busy="true">
      <ThumbNavigationBar tone="paper" className="gap-0" showTheme={false}>
        <span
          className="block size-11 animate-pulse rounded-full bg-[#211D18]/80"
          aria-hidden="true"
        />
        <span className="sr-only">Loading navigation</span>
      </ThumbNavigationBar>
    </div>
  )
}
