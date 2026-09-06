import { Button } from '@/components/ui/button'
import type { EventFormValues } from '@/lib/events/schema'

export function CreationReview({
  values,
  noLimit,
  onEdit,
  hosts,
  leaders,
}: {
  values: EventFormValues
  noLimit: boolean
  onEdit: (step: string) => void
  hosts: string[]
  leaders: string[]
}) {
  const sections = [
    {
      id: 'basics',
      title: values.title || 'Untitled trip',
      lines: [
        values.isOfficial ? 'Official club trip' : 'Community meetup',
        values.kind,
        values.activityTypes?.join(', '),
        values.shortSummary,
      ],
    },
    {
      id: 'place',
      title: 'When & where',
      lines: [
        `${values.startAt.replace('T', ' ')} → ${values.endAt.replace('T', ' ')}`,
        values.timezone,
        values.primaryLocationName,
        values.meetingLocationName,
        values.locationNotes,
      ],
    },
    {
      id: 'details',
      title: 'Trip details',
      lines: [
        values.difficulty === 'Easy' ? 'Beginner' : values.difficulty,
        values.overviewWhat,
        values.overviewWhere,
        values.overviewWeather,
        values.overviewEquipment,
        values.overviewCarpoolNeedGear,
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      lines: [
        values.visibility.replaceAll('_', ' '),
        noLimit
          ? 'No participant limit'
          : `${values.maxParticipants} participants`,
        values.collectTransportation
          ? 'Transportation preferences enabled'
          : 'Transportation preferences off',
        hosts.length ? `Hosts: ${hosts.join(', ')}` : '',
        leaders.length ? `Leaders: ${leaders.join(', ')}` : '',
      ],
    },
  ]
  return (
    <div className="divide-y divide-foreground/15">
      {sections.map(section => (
        <section key={section.id} className="space-y-3 py-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-medium">{section.title}</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onEdit(section.id)}
              aria-label={`Edit ${section.title}`}
            >
              Edit
            </Button>
          </div>
          {section.lines.filter(Boolean).map((line, index) => (
            <p
              key={`${section.id}-${index}`}
              className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
            >
              {line}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
