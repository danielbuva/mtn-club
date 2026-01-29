import { type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SettingsCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function SettingsCard({ title, description, children, footer }: SettingsCardProps) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer ? <div className="pt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}
