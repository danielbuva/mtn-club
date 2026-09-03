'use client'

import { Card, CardContent } from '@/components/ui/card'

export type TripAssignmentOption = { id: string; label: string }

function AssignmentChoices({
  legend,
  description,
  options,
  selected,
  onChange,
}: {
  legend: string
  description: string
  options: TripAssignmentOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 grid gap-2">
        {options.map(option => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={event =>
                onChange(
                  event.target.checked
                    ? [...selected, option.id]
                    : selected.filter(id => id !== option.id),
                )
              }
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function TripAssignmentsEditor({
  publicHosts,
  leaders,
  selectedPublicHostIds,
  selectedLeaderIds,
  onPublicHostsChange,
  onLeadersChange,
}: {
  publicHosts: TripAssignmentOption[]
  leaders: TripAssignmentOption[]
  selectedPublicHostIds: string[]
  selectedLeaderIds: string[]
  onPublicHostsChange: (values: string[]) => void
  onLeadersChange: (values: string[]) => void
}) {
  return (
    <Card>
      <CardContent className="grid gap-6 p-5 sm:grid-cols-2">
        <AssignmentChoices
          legend="Public host credits"
          description="Names shown to visitors and members."
          options={publicHosts}
          selected={selectedPublicHostIds}
          onChange={onPublicHostsChange}
        />
        <AssignmentChoices
          legend="Linked account leaders"
          description="Assignments used by assigned-only permissions."
          options={leaders}
          selected={selectedLeaderIds}
          onChange={onLeadersChange}
        />
      </CardContent>
    </Card>
  )
}
