export function AuthFormSkeleton({
  mode = 'login',
}: {
  mode?: 'login' | 'signup' | 'recovery' | 'password'
}) {
  const credentials = mode === 'login' || mode === 'signup'
  const fields =
    mode === 'signup'
      ? ['email', 'password', 'confirm']
      : mode === 'recovery'
        ? ['email']
        : mode === 'password'
          ? ['password', 'confirm']
          : ['email', 'password']
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="space-y-5 animate-pulse"
    >
      {credentials && (
        <>
          <div className="grid gap-3">
            <div className="h-12 border bg-muted/40" />
            <div className="h-12 border bg-muted/40" />
          </div>
          <div className="h-4 bg-muted/40" />
        </>
      )}
      {mode === 'password' && <div className="h-6 w-4/5 bg-muted/30" />}
      {fields.map(field => (
        <div key={field} className="grid gap-2">
          <div className="h-4 w-24 bg-muted/50" />
          <div className="h-12 border bg-muted/40" />
          {(mode === 'signup' || mode === 'password') &&
            field === 'password' && <div className="h-12 bg-muted/30" />}
        </div>
      ))}
      {mode === 'login' && <div className="ml-auto h-11 w-32 bg-muted/30" />}
      {mode === 'signup' ? (
        <div className="flex min-h-12 items-center gap-3 border border-foreground/25 bg-background px-4 text-sm leading-6">
          <span className="size-4 shrink-0 border border-foreground/40" />
          <span>I am 18 years of age or older.</span>
        </div>
      ) : null}
      {mode !== 'password' && (
        <div className="h-36 border bg-muted/30 min-[332px]:h-16" />
      )}
      <div className="h-12 bg-primary/30" />
      {mode === 'signup' && <div className="h-12 bg-muted/30" />}
      {mode !== 'password' && <div className="h-11 bg-muted/30" />}
      <span className="sr-only">Loading secure form…</span>
    </div>
  )
}
