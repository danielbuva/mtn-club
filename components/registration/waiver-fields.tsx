'use client'

import { Input } from '@/components/ui/input'
import type {
  RegistrationInput,
  TripRegistrationSnapshot,
} from '@/lib/registration/schema'
import { AnnualWaiverIntro } from './annual-waiver-intro'
import { WaiverReader } from './waiver-reader'

type SignerDetails = NonNullable<RegistrationInput['data']['signerDetails']>
export const emptySignerDetails: SignerDetails = {
  phone: '',
  address: '',
  emergencyAddress: '',
  birthDate: '',
  initials: Array.from({ length: 7 }, () => ''),
}
const provisions = [
  'Medical treatment and responsibility for costs',
  'Personal insurance',
  'Activity risks and possible injuries',
  'Physical and mental health',
  'Photographs and recordings',
  'Entire agreement and continuing effect',
  'Voluntary agreement, adult age, and Nevada law',
]

export function WaiverFields({
  snapshot,
  agreed,
  onAgree,
  signature,
  onSignature,
  details,
  onDetails,
  hasRead,
  onRead,
  errors = {},
}: {
  snapshot: Pick<
    TripRegistrationSnapshot,
    | 'waiverRequired'
    | 'waiverSigned'
    | 'waiver'
    | 'ageAdult'
    | 'annualWaiver'
    | 'waiverCoverage'
    | 'waiverReason'
    | 'waiverApplicable'
  >
  agreed: boolean
  onAgree: (value: boolean) => void
  signature: string
  onSignature: (value: string) => void
  details: SignerDetails
  onDetails: (value: SignerDetails) => void
  hasRead: boolean
  onRead: () => void
  errors?: Record<string, string>
}) {
  const signatureErrors = Object.entries(errors)
    .filter(([key]) => key !== 'waiverRead')
    .map(([, value]) => value)
  if (!snapshot.waiverRequired) return null
  if (snapshot.annualWaiver && snapshot.waiverApplicable === false)
    return (
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">
          A waiver process is required before participation
        </h2>
        <p>{snapshot.waiverReason}</p>
        <p>
          The current annual waiver cannot cover this trip. Contact an officer
          to arrange the applicable process. Your RSVP can remain registered
          while this requirement is resolved.
        </p>
      </section>
    )
  return (
    <section className="space-y-3 rounded-lg border p-4">
      {snapshot.annualWaiver && (
        <AnnualWaiverIntro coverage={snapshot.waiverCoverage} />
      )}
      {snapshot.waiverReason && (
        <p className="text-sm">{snapshot.waiverReason}</p>
      )}
      {signatureErrors.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          {Array.from(new Set(signatureErrors)).join(' ')}
        </p>
      )}
      <h2 className="font-semibold">
        {snapshot.waiver?.title ?? 'Waiver not configured'}
      </h2>
      {snapshot.waiver ? (
        <WaiverReader
          key={`${snapshot.waiver.id}:${snapshot.waiver.version}`}
          title={snapshot.waiver.title}
          body={snapshot.waiver.body}
          version={snapshot.waiver.version}
          hasRead={hasRead || snapshot.waiverSigned}
          onRead={onRead}
          error={errors.waiverRead}
        />
      ) : (
        <p>
          An organizer must add the required waiver before registration opens.
        </p>
      )}
      {snapshot.waiverSigned ? (
        <p>
          {snapshot.ageAdult === false
            ? 'An officer verified your parent or guardian’s signed document for'
            : 'You have signed'}{' '}
          version {snapshot.waiver?.version}.
        </p>
      ) : snapshot.ageAdult === false ? (
        <p>
          Have your parent or legal guardian complete and sign the displayed
          annual waiver, then contact a club officer to verify it before
          registration. You cannot sign the adult agreement yourself.
        </p>
      ) : !hasRead ? (
        <p className="text-sm text-muted-foreground">
          Open the waiver and read it through before completing your signature.
        </p>
      ) : (
        <>
          {snapshot.waiver?.sourceUrl ? (
            <fieldset className="space-y-3">
              <legend className="font-medium">Complete the waiver</legend>
              <p className="text-sm">
                Your typed name signs this exact version. Your account identity
                and server signing time are recorded. These details are
                restricted to you and authorized trip managers. Initial each
                provision after reading the full waiver.
              </p>
              {provisions.map((provision, index) => (
                <label
                  className="block text-sm"
                  key={provision}
                  htmlFor={`waiver-initial-${index}`}
                >
                  {index + 1}. {provision} — initials
                  <Input
                    required
                    id={`waiver-initial-${index}`}
                    aria-invalid={Boolean(
                      errors[`signerDetails.initials.${index}`],
                    )}
                    maxLength={10}
                    value={details.initials[index]}
                    onChange={e =>
                      onDetails({
                        ...details,
                        initials: details.initials.map((value, i) =>
                          i === index ? e.target.value : value,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              {(
                ['phone', 'address', 'emergencyAddress', 'birthDate'] as const
              ).map(key => (
                <label
                  className="block text-sm"
                  key={key}
                  htmlFor={`waiver-${key}`}
                >
                  {
                    {
                      phone: 'Your phone number',
                      address: 'Your local address',
                      emergencyAddress: 'Emergency contact address',
                      birthDate: 'Your date of birth',
                    }[key]
                  }
                  <Input
                    required
                    id={`waiver-${key}`}
                    type={
                      key === 'birthDate'
                        ? 'date'
                        : key === 'phone'
                          ? 'tel'
                          : 'text'
                    }
                    aria-invalid={Boolean(errors[`signerDetails.${key}`])}
                    maxLength={key === 'phone' ? 50 : 500}
                    value={details[key]}
                    onChange={e =>
                      onDetails({ ...details, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <p className="text-sm">
                Include medical services, conditions, and allergies relevant to
                emergency care in the emergency contact notes above. Contact an
                organizer before signing if a provision does not describe your
                circumstances.
              </p>
            </fieldset>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              aria-invalid={Boolean(errors.waiverAgreed)}
              checked={agreed}
              onChange={e => onAgree(e.target.checked)}
            />
            I have read and agree to this waiver (version{' '}
            {snapshot.waiver?.version}).
          </label>
          <label className="block text-sm" htmlFor="signature">
            Full name as signature
            <Input
              id="signature"
              aria-invalid={Boolean(errors.signatureName)}
              required
              minLength={2}
              maxLength={200}
              value={signature}
              onChange={e => onSignature(e.target.value)}
            />
          </label>
          <p className="text-sm">
            Submitting this form records your electronic signature and
            agreement.
          </p>
        </>
      )}
    </section>
  )
}
