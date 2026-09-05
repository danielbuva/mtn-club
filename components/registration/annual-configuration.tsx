'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { z } from 'zod'
import { FormActions } from '@/components/forms/form-actions'
import {
  FormMessage,
  FormProgress,
  FormShell,
  FormStep,
} from '@/components/forms/form-shell'
import { FormViewport } from '@/components/forms/form-viewport'
import { Button } from '@/components/ui/button'
import {
  createAnnualAction,
  publishAnnualAction,
} from '@/lib/registration/annual-actions'
import type { annualDocumentSchema } from '@/lib/registration/annual-schema'
import { waiverDate } from './annual-waiver-intro'

type Document = z.infer<typeof annualDocumentSchema> & {
  publishedAt: string | null
}
export function AnnualConfiguration({ documents }: { documents: Document[] }) {
  const [event, setEvent] = useState('')
  const [sponsor, setSponsor] = useState('UNLV Mountain Club')
  const [start, setStart] = useState('')
  const [activities, setActivities] = useState('')
  const [risks, setRisks] = useState('')
  const [reference, setReference] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">
        Annual UNLV waiver configuration
      </h2>
      <p>
        Fill only the UNLV template’s designated fields. Save a draft for
        review; publishing requires a review reference. Publishing a replacement
        requires participants to sign the new version. Signed documents cannot
        be edited.
      </p>
      <FormShell
        onSubmit={async e => {
          e.preventDefault()
          if (pending) return
          setPending(true)
          try {
            const result = await createAnnualAction({
              event,
              sponsor,
              effectiveFrom: start,
              activities: activities
                .split('\n')
                .map(x => x.trim())
                .filter(Boolean),
              risks,
            })
            setMessage(result.message)
            if (result.ok) router.refresh()
          } catch {
            setMessage('Unable to save draft. Retry.')
          } finally {
            setPending(false)
          }
        }}
      >
        <FormProgress index={0} count={1} />
        <FormMessage>{message}</FormMessage>
        <FormViewport stepId="annual-configuration" direction={1}>
          <FormStep title="Designated template fields">
            <div className="space-y-4">
              {[
                {
                  label:
                    'Event name — identify the recurring activities and academic year',
                  value: event,
                  set: setEvent,
                },
                {
                  label: 'RSO / Sponsor name',
                  value: sponsor,
                  set: setSponsor,
                },
                {
                  label: 'Coverage start — July 1 (YYYY-MM-DD)',
                  value: start,
                  set: setStart,
                },
              ].map(field => (
                <label className="block" key={field.label}>
                  {field.label}
                  <input
                    required
                    className="mt-2 w-full rounded border bg-background p-3"
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                  />
                </label>
              ))}
              <p className="text-sm">
                Coverage ends June 30 of the following year. The generated date
                range is inserted into Date of Event.
              </p>
              <label className="block">
                Specifically covered activities, one per line
                <textarea
                  required
                  className="mt-2 min-h-24 w-full rounded border bg-background p-3"
                  value={activities}
                  onChange={e => setActivities(e.target.value)}
                />
              </label>
              <label className="block">
                Activity-specific risks / possible injuries — wording for review
                <textarea
                  required
                  className="mt-2 min-h-40 w-full rounded border bg-background p-3"
                  value={risks}
                  onChange={e => setRisks(e.target.value)}
                />
              </label>
              <p className="text-sm">
                Name each covered activity in the Event field or risk text as
                well as the activity list. Do not use “anything the club does”
                or an unrestricted catch-all. Confirm the filled scope and risks
                with UNLV before production use.
              </p>
            </div>
          </FormStep>
        </FormViewport>
        <FormActions pending={pending} primaryLabel="Save draft for review" />
      </FormShell>
      {documents.map(document => (
        <details className="rounded border p-4" key={document.id}>
          <summary className="cursor-pointer">
            {document.title} · v{document.version} ·{' '}
            {document.publishedAt ? 'Published' : 'Draft for review'}
          </summary>
          <div className="mt-4 space-y-4">
            <p>
              Valid {waiverDate(document.effective_from)} through{' '}
              {waiverDate(document.effective_until)}
            </p>
            <p>Activities: {document.activity_scope.join(', ')}</p>
            <p className="whitespace-pre-wrap">{document.body}</p>
            {!document.publishedAt && (
              <>
                <label className="block">
                  UNLV / club review reference
                  <input
                    className="mt-2 w-full rounded border bg-background p-3"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                  />
                </label>
                <Button
                  disabled={pending || reference.trim().length < 5}
                  onClick={async () => {
                    setPending(true)
                    try {
                      const result = await publishAnnualAction(
                        document.id,
                        reference,
                      )
                      setMessage(result.message)
                      if (result.ok) router.refresh()
                    } catch {
                      setMessage(
                        'Unable to publish. Check the review reference and retry.',
                      )
                    } finally {
                      setPending(false)
                    }
                  }}
                >
                  Publish reviewed version
                </Button>
              </>
            )}
          </div>
        </details>
      ))}
    </section>
  )
}
