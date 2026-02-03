type HeroMediaProps = {
  caption?: string
  variant?: 'gradient' | 'image'
  mediaClassName?: string
}

export function HeroMedia({
  caption,
  variant = 'gradient',
  mediaClassName,
}: HeroMediaProps) {
  const baseClass =
    variant === 'image'
      ? 'h-full w-full rounded-3xl bg-secondary/20'
      : 'h-full w-full rounded-3xl border border-border/50 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%),linear-gradient(135deg,_rgba(130,130,130,0.25),_rgba(30,30,30,0.18))]'

  return (
    <div>
      <div className={`${baseClass} ${mediaClassName ?? ''}`} />
      {caption ? (
        <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          {caption}
        </p>
      ) : null}
    </div>
  )
}
