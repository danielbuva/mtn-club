export function WaiverFieldError({
  id,
  error,
}: {
  id: string
  error?: string
}) {
  return (
    <span
      id={id}
      role={error ? 'alert' : undefined}
      className="block min-h-10 text-sm text-destructive"
    >
      {error}
    </span>
  )
}
