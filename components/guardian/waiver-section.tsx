'use client'
import { waiverProvisions } from '@/components/registration/waiver-fields'
import { WaiverReader } from '@/components/registration/waiver-reader'
import { waiverDate } from '@/lib/guardian/presentation'
import type { OpenGuardianRequest } from '@/lib/guardian/schema'
import type { SignFormValues } from '@/lib/guardian/sign-form'
import { CheckRow, Eyebrow, Field, FieldError } from './ui'

type Waiver = NonNullable<OpenGuardianRequest['waiver']>

/** Once a birth date is in, say exactly when coverage ends. */
function coverageHint(birthDate: string, waiverUntil: string, first: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null
  const [y, m, d] = birthDate.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y + 18, m - 1, d - 1))
    .toISOString()
    .slice(0, 10)
  return lastDay < waiverUntil
    ? `Covers ${first} through ${waiverDate(lastDay)}, the day before they turn 18.`
    : `Covers ${first} through ${waiverDate(waiverUntil)}.`
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-5 border-t border-foreground/80 pt-5"
    >
      <h2
        id={id}
        className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
export { Section as SignSection }

export function WaiverSection({
  waiver,
  participantName,
  values,
  set,
  errors,
}: {
  waiver: Waiver
  participantName: string
  values: SignFormValues
  set: (patch: Partial<SignFormValues>) => void
  errors: Record<string, string>
}) {
  const first = participantName.split(' ')[0]
  const coverage = coverageHint(values.birthDate, waiver.until, first)
  const setEmergency = (
    key: keyof SignFormValues['emergency'],
    value: string,
  ) => set({ emergency: { ...values.emergency, [key]: value } })
  return (
    <>
      <Section id="g-waiver-heading" title="Activity waiver">
        <p className="text-base leading-7">
          This is UNLV’s official liability waiver for {participantName}. It
          covers{' '}
          <span className="font-semibold">{waiver.activities.join(', ')}</span>{' '}
          for the waiver year, {waiverDate(waiver.from)} to{' '}
          {waiverDate(waiver.until)}, or until the day before {first} turns 18
          if that comes first. You sign once for that whole period. It doesn’t
          cover any other activity.
        </p>
        <div
          className="space-y-2"
          data-invalid={errors['g-read'] ? 'true' : undefined}
        >
          <WaiverReader
            editorial
            title={waiver.title}
            body={waiver.body}
            version={waiver.version}
            hasRead={values.waiverRead}
            onRead={() => set({ waiverRead: true })}
          />
          <FieldError id="g-read-error">{errors['g-read']}</FieldError>
          <p className="text-sm text-muted-foreground">
            {values.waiverRead
              ? `Read to the end · Version ${waiver.version}`
              : 'Open it and scroll to the end before you initial.'}
          </p>
        </div>
      </Section>
      <Section id="g-initials-heading" title="Initial each section">
        <p className="text-base leading-7 text-muted-foreground">
          The waiver asks for your initials beside each of these. Initial after
          you’ve read it.
        </p>
        <ol className="divide-y divide-border border-y border-border">
          {waiverProvisions.map((provision, index) => (
            <li
              key={provision}
              className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-start gap-4 py-3"
            >
              <label
                htmlFor={`g-initial-${index}`}
                className="pt-3 text-base leading-6"
              >
                <span className="mr-2 font-brand font-bold">{index + 1}.</span>
                {provision}
              </label>
              <div className="space-y-1">
                <input
                  id={`g-initial-${index}`}
                  aria-label={`Initials for ${provision}`}
                  aria-invalid={Boolean(errors[`g-initial-${index}`])}
                  aria-describedby={
                    errors[`g-initial-${index}`]
                      ? `g-initial-${index}-error`
                      : undefined
                  }
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={values.initials[index]}
                  onChange={event =>
                    set({
                      initials: values.initials.map((value, i) =>
                        i === index ? event.target.value : value,
                      ),
                    })
                  }
                  className={`block min-h-12 w-full border bg-transparent text-center font-brand text-lg font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground ${errors[`g-initial-${index}`] ? 'border-[#d40000] dark:border-[#ff8a80]' : 'border-foreground/35'}`}
                />
                <FieldError id={`g-initial-${index}-error`}>
                  {errors[`g-initial-${index}`] ? 'Needed' : null}
                </FieldError>
              </div>
            </li>
          ))}
        </ol>
        <CheckRow
          id="g-agree"
          checked={values.waiverAgreed}
          onChange={value => set({ waiverAgreed: value })}
          error={errors['g-agree']}
        >
          I’ve read the waiver (version {waiver.version}) and agree to it on
          behalf of {participantName} and myself.
        </CheckRow>
      </Section>
      <Section id="g-participant-heading" title={`About ${participantName}`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="g-birth"
            label="Date of birth"
            type="date"
            autoComplete="off"
            value={values.birthDate}
            error={errors['g-birth']}
            hint={coverage ?? undefined}
            onChange={event => set({ birthDate: event.target.value })}
          />
          <Field
            id="g-address"
            label="Local address"
            autoComplete="street-address"
            value={values.address}
            error={errors['g-address']}
            maxLength={500}
            onChange={event => set({ address: event.target.value })}
          />
        </div>
        <div className="space-y-3">
          <Eyebrow>Emergency contact</Eyebrow>
          <p className="text-base leading-7 text-muted-foreground">
            Trip leaders call this person in an emergency. It can be you.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="g-em-name"
              label="Name"
              autoComplete="off"
              maxLength={200}
              value={values.emergency.name}
              error={errors['g-em-name']}
              onChange={event => setEmergency('name', event.target.value)}
            />
            <Field
              id="g-em-relationship"
              label="Relationship"
              autoComplete="off"
              maxLength={200}
              value={values.emergency.relationship}
              error={errors['g-em-relationship']}
              onChange={event =>
                setEmergency('relationship', event.target.value)
              }
            />
            <Field
              id="g-em-phone"
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={50}
              value={values.emergency.phone}
              error={errors['g-em-phone']}
              onChange={event => setEmergency('phone', event.target.value)}
            />
            <Field
              id="g-em-address"
              label="Address"
              autoComplete="off"
              maxLength={500}
              value={values.emergency.address}
              error={errors['g-em-address']}
              onChange={event => setEmergency('address', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="g-em-notes" className="block text-sm font-medium">
              Medical needs, conditions, or allergies
              <span className="font-normal text-muted-foreground">
                {' '}
                (optional)
              </span>
            </label>
            <textarea
              id="g-em-notes"
              aria-describedby="g-em-notes-hint"
              maxLength={1000}
              rows={3}
              value={values.emergency.notes}
              onChange={event => setEmergency('notes', event.target.value)}
              className="block w-full border border-foreground/35 bg-transparent px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
            />
            <p id="g-em-notes-hint" className="text-sm text-muted-foreground">
              Shared only with this trip’s leaders and club officers.
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
