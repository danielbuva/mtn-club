export function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <span className="text-xs font-semibold">MC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">UNLV Mountain Club</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground">
              Home
            </span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground">
              Get Started
            </span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground">
              Team
            </span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground">
              About
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block h-9 w-9" aria-hidden />
            <div className="hidden sm:block h-9 w-28" aria-hidden />
            <div className="md:hidden h-9 w-9" aria-hidden />
          </div>
        </div>
      </div>
    </header>
  )
}
