const factKeys = ['when', 'where', 'spots', 'signups'] as const
const sectionKeys = ['overview', 'logistics'] as const
const lineKeys = ['a', 'b', 'c'] as const

export default function TripDetailLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-6xl px-4 pt-8 pb-36 md:px-6 md:pt-12"
    >
      <span className="sr-only">Loading trip</span>
      <div className="space-y-5">
        <div className="h-4 w-64 animate-pulse bg-muted" />
        <div className="space-y-2">
          <div className="h-10 w-full max-w-2xl animate-pulse bg-muted md:h-14" />
          <div className="h-10 w-3/5 max-w-xl animate-pulse bg-muted md:h-14" />
        </div>
        <div className="flex items-center gap-3">
          <div className="size-8 animate-pulse bg-muted" />
          <div className="h-4 w-48 animate-pulse bg-muted" />
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-12">
        <div className="border-2 border-border lg:col-start-2 lg:row-start-1">
          {factKeys.map(key => (
            <div
              key={key}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="h-3 w-12 animate-pulse bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-36 animate-pulse bg-muted" />
                <div className="h-4 w-24 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-10 lg:col-start-1 lg:row-start-1">
          {sectionKeys.map(key => (
            <div key={key} className="space-y-4 border-t border-border pt-5">
              <div className="h-6 w-40 animate-pulse bg-muted" />
              {lineKeys.map(line => (
                <div
                  key={line}
                  className="h-4 w-full max-w-prose animate-pulse bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
