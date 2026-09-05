export function FormSkeleton({ creation = false }: { creation?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8" aria-busy="true">
      <output className="sr-only">
        Loading {creation ? 'trip form options' : 'registration details'}…
      </output>
      <div className="h-3 w-48 animate-pulse bg-secondary" />
      <div className="h-1 animate-pulse bg-secondary" />
      <div className="h-10 w-4/5 animate-pulse bg-secondary" />
      <div className="space-y-5">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className={
              creation
                ? 'h-16 animate-pulse bg-secondary/60'
                : 'h-24 animate-pulse border border-foreground/15 bg-secondary/40'
            }
          />
        ))}
      </div>
      {creation && <div className="h-28 animate-pulse bg-secondary/60" />}
      <div className="ml-auto h-12 w-40 animate-pulse bg-secondary" />
    </div>
  )
}
