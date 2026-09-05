export function MoreNavigationFallback() {
  return (
    <div className="space-y-7" aria-busy="true">
      <span className="sr-only">Loading pages</span>
      {[0, 1, 2].map(section => (
        <div key={section} className="space-y-3" aria-hidden="true">
          <div className="h-4 w-32 animate-pulse bg-muted" />
          <div className="grid grid-cols-2 gap-x-4">
            {[0, 1, 2, 3, 4, 5].map(link => (
              <div key={link} className="flex min-h-12 items-center">
                <div className="h-4 w-28 animate-pulse bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
