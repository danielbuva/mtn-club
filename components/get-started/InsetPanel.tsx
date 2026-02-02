type InsetPanelProps = {
  title: string
  rows: { label: string; value: string }[]
}

export function InsetPanel({ title, rows }: InsetPanelProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/30 p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="mt-4 space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/80 font-medium">{row.label}</span>
            <span className="text-muted-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
