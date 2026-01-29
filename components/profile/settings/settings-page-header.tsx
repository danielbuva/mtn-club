import { type ReactNode } from 'react'

type SettingsPageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function SettingsPageHeader({ title, description, actions }: SettingsPageHeaderProps) {
  return (
    <div className="scroll-mt-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
