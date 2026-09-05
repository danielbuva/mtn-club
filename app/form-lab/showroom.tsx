'use client'

import { Mountain, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { TripCreationFlow } from '@/components/events/trip-creation-flow'
import { ToggleField } from '@/components/forms/fields'
import { RegistrationFlow } from '@/components/registration/registration-flow'
import { Button } from '@/components/ui/button'
import { createUnlvWaiver } from '@/lib/registration/unlv-waiver'
import { creationFixture, registrationFixture } from './fixtures'
import { FieldGallery } from './gallery'
import { RegistrationRegressions } from './registration-regressions'

type Example = 'creation' | 'registration' | 'gallery'
const ageReasons = (adult: boolean | null) =>
  adult === false
    ? ['An officer must verify guardian consent before you can confirm.']
    : []
export function FormShowroom() {
  const [savedAge, setSavedAge] = useState<boolean | null>(null)
  const [savedPreferences, setSavedPreferences] = useState({
    showInAttendeeList: false,
    emailUpdates: false,
  })
  const [example, setExample] = useState<Example>('registration')
  const [revision, setRevision] = useState(0)
  const [transportation, setTransportation] = useState(true)
  const [annual, setAnnual] = useState(false)
  const [missingRisks, setMissingRisks] = useState(false)
  const [signed, setSigned] = useState(false)
  const [longContent, setLongContent] = useState(false)
  const [fail, setFail] = useState(false)
  async function simulate() {
    await new Promise(resolve => setTimeout(resolve, 900))
    if (fail)
      throw new Error(
        'That didn’t go through. Your answers are still here. Turn off the connection example and try again.',
      )
  }
  const snapshot = {
    ...registrationFixture,
    ...(annual
      ? {
          annualWaiver: true,
          waiverSigned: signed,
          waiverCoverage: {
            from: '2026-07-01',
            until: '2027-06-30',
            activities: ['hiking', 'scrambling'],
          },
          informedRisks: missingRisks
            ? null
            : {
                id: '33333333-3333-4333-8333-333333333333',
                revision: 1,
                statements: [
                  'Expect exposed desert heat and steep sandstone scrambling.',
                ],
                activities: ['hiking', 'scrambling'],
              },
          risksAcknowledged: false,
          waiver: registrationFixture.waiver
            ? {
                ...registrationFixture.waiver,
                title: 'MTN Outdoor Adventures — 2026–2027',
                body: createUnlvWaiver(
                  'MTN hiking and scrambling — 2026–2027',
                  'July 1, 2026 – June 30, 2027',
                  'Hiking and scrambling: falls, heat illness, serious injury and death.',
                ),
              }
            : null,
        }
      : {}),
    ageAdult: savedAge,
    eligibilityReasons: ageReasons(savedAge),
    ...savedPreferences,
    defaultShowInAttendeeList: savedPreferences.showInAttendeeList,
    collectTransportation: transportation,
    ...(longContent
      ? {
          questions: [
            ...registrationFixture.questions,
            {
              id: 'notes',
              label: 'What would make this a great day for you?',
              type: 'text' as const,
              required: false,
            },
          ],
        }
      : {}),
  }
  return (
    <main
      data-editorial-surface
      data-guided-form
      className="min-h-screen bg-background px-5 py-8 text-foreground md:px-10 md:py-12"
    >
      <header className="mx-auto mb-12 max-w-5xl space-y-7 border-b border-foreground/15 pb-8">
        <div className="flex items-center gap-3">
          <Mountain className="size-6" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            MTN Club / Field notes
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-brand text-4xl md:text-5xl">
              A little less paperwork.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Two ways to get outside. One familiar feeling.
            </p>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Form language preview. Nothing here creates a trip or saves a
            registration.
          </p>
        </div>
        <nav aria-label="Form examples" className="flex flex-wrap gap-3">
          {(
            [
              { value: 'registration', label: 'Join a trip' },
              { value: 'creation', label: 'Plan a trip' },
              { value: 'gallery', label: 'The building blocks' },
            ] as const
          ).map(item => (
            <Button
              key={item.value}
              type="button"
              variant={example === item.value ? 'default' : 'ghost'}
              className="min-h-11"
              aria-current={example === item.value ? 'page' : undefined}
              onClick={() => setExample(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </header>
      <div
        className={
          example === 'registration'
            ? 'mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]'
            : 'mx-auto max-w-3xl'
        }
      >
        <div
          key={`${example}-${revision}-${transportation}-${longContent}-${annual}-${signed}`}
        >
          {example === 'creation' && (
            <TripCreationFlow
              initialValues={creationFixture}
              initialNoLimit={false}
              canChooseOfficial
              activityOptions={['hiking', 'climbing', 'camping']}
              publicHostOptions={[]}
              leaderOptions={[]}
              onSave={async () => {
                await simulate()
                return 'Preview draft saved for this demonstration.'
              }}
              onPublish={async () => {
                await simulate()
                return 'Preview complete — no trip was published.'
              }}
            />
          )}
          {example === 'registration' && (
            <RegistrationFlow
              snapshot={snapshot}
              onDeclareAge={async adult => {
                setSavedAge(adult)
                return {
                  ...snapshot,
                  ageAdult: adult,
                  eligibilityReasons: ageReasons(adult),
                }
              }}
              onPersist={async (data, intent, current) => {
                await simulate()
                const preferences = data.joiningPreferences
                if (preferences)
                  setSavedPreferences({
                    showInAttendeeList: preferences.showInAttendeeList,
                    emailUpdates: preferences.emailUpdates,
                  })
                return {
                  ok: true,
                  snapshot: {
                    ...current,
                    ...(preferences
                      ? {
                          showInAttendeeList: preferences.showInAttendeeList,
                          defaultShowInAttendeeList:
                            preferences.showInAttendeeList,
                          emailUpdates: preferences.emailUpdates,
                        }
                      : {}),
                    revision: current.revision + 1,
                    answers: data.answers ?? {},
                    transportation: data.transportation ?? null,
                    emergencyContact:
                      data.emergencyContact ?? current.emergencyContact,
                    state: intent === 'draft' ? 'incomplete' : 'confirmed',
                    actions:
                      intent === 'draft'
                        ? current.actions
                        : ['update_response'],
                    waiverSigned:
                      current.waiverSigned || Boolean(data.waiverAgreed),
                    risksAcknowledged: Boolean(data.riskAcknowledged),
                  },
                }
              }}
            />
          )}
          {example === 'gallery' && <FieldGallery />}
        </div>
        {example === 'registration' && (
          <aside className="hidden space-y-5 border-l border-foreground/15 pl-8 lg:block">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              On the horizon
            </p>
            <h2 className="font-brand text-3xl">
              Sunrise at
              <br />
              Calico Tanks
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              November 14 · Red Rock Canyon
              <br />
              Sandstone, fresh air, good company.
            </p>
            <div className="border-t border-foreground/15 pt-5 text-sm">
              8 of 16 places filled
            </div>
          </aside>
        )}
      </div>
      <footer className="mx-auto mt-16 max-w-2xl border-t border-foreground/15 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setRevision(value => value + 1)}
        >
          <RotateCcw className="size-4" />
          Start fresh
        </Button>
        <details className="mt-4 text-sm text-muted-foreground">
          <summary className="cursor-pointer py-3">
            Try a different situation
          </summary>
          {example === 'registration' && (
            <>
              <ToggleField
                label="Annual waiver example"
                checked={annual}
                onChange={setAnnual}
              />
              <ToggleField
                label="Annual waiver already signed"
                checked={signed}
                onChange={setSigned}
              />
              <ToggleField
                label="Trip risks not configured"
                checked={missingRisks}
                onChange={setMissingRisks}
              />
              <ToggleField
                label="Ask about transportation"
                checked={transportation}
                onChange={setTransportation}
              />
              <ToggleField
                label="Include longer reading and writing"
                checked={longContent}
                onChange={setLongContent}
              />
            </>
          )}
          <ToggleField
            label="Try an interrupted connection"
            hint="Shows a recoverable error when you save."
            checked={fail}
            onChange={setFail}
          />
        </details>
      </footer>
      <RegistrationRegressions />
    </main>
  )
}
