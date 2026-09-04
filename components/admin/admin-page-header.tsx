import type { ReactNode } from 'react'

export function AdminPageHeader({
  eyebrow = 'Leadership admin',
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex min-w-0 max-w-full flex-wrap items-end justify-between gap-5">
      <div className="min-w-0 max-w-full">
        <p className="font-brand text-xs uppercase tracking-[0.2em] text-[#6A5146] dark:text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-brand text-4xl uppercase tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-[#6A5146] dark:text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  )
}
