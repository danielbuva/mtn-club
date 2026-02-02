type FeatureBlockProps = {
  label: string
  title: string
}

export function FeatureBlock({ label, title }: FeatureBlockProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%),linear-gradient(135deg,_rgba(120,120,120,0.25),_rgba(30,30,30,0.15))] p-6 md:p-10">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-6 text-lg md:text-2xl font-semibold text-foreground">
        {title}
      </p>
      <div className="mt-6 h-40 md:h-56 rounded-2xl bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02))]" />
    </div>
  )
}
