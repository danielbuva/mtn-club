import { FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EventFormValues } from '@/lib/events/schema'

type EventDescriptionSectionProps = {
  values: EventFormValues
  fieldErrors: Record<string, string>
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventDescriptionSection({
  values,
  fieldErrors,
  onFieldChange,
}: EventDescriptionSectionProps) {
  return (
    <section className="space-y-2">
      <Label
        htmlFor="shortSummary"
        className="inline-flex items-center gap-1.5"
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        Description
      </Label>
      <Textarea
        id="shortSummary"
        value={values.shortSummary ?? ''}
        onChange={e => onFieldChange('shortSummary', e.target.value)}
        rows={3}
      />
      {fieldErrors.shortSummary ? (
        <p className="text-xs text-red-500">{fieldErrors.shortSummary}</p>
      ) : null}
    </section>
  )
}
