'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { withdrawAnnualAction } from '@/lib/registration/annual-actions'
import type { AnnualState } from '@/lib/registration/annual-schema'
import { AnnualSigningForm } from './annual-signing-form'
import { waiverDate } from './annual-waiver-intro'
export function AnnualProfile({ state }: { state: AnnualState }) {
  const [signing, setSigning] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const latest = state.history[0]
  const valid = state.history.find(
    record => record.signatureId === state.signatureId,
  )
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Outdoor Adventures Waiver</h2>
      <p className="font-medium">
        {valid
          ? `✓ Valid through ${waiverDate(valid.validUntil)}`
          : latest?.withdrawnAt
            ? 'Withdrawn for future trips'
            : latest
              ? 'Current waiver required'
              : 'Not signed'}
      </p>
      {valid ? (
        <>
          <p>Signed {new Date(valid.signedAt).toLocaleDateString('en-US')}</p>
          <p>
            This annual UNLV RSO waiver covers the listed MTN Club
            outdoor-adventure activities for the current academic year. You
            won’t need to sign it again on every covered trip.
          </p>
        </>
      ) : (
        <p>
          Sign the current annual waiver once to cover eligible trips during its
          stated July–June period.{' '}
          {latest &&
            'Your previous document and signature remain in your history.'}
        </p>
      )}
      {!valid && !signing && (
        <Button onClick={() => setSigning(true)}>
          {latest ? 'Sign current waiver' : 'Review & sign waiver'}
        </Button>
      )}
      {!valid && signing && (
        <AnnualSigningForm key={state.current?.id} state={state} />
      )}
      {state.history.map(record => (
        <details
          className="min-w-0 max-w-full rounded-lg border p-4 [overflow-wrap:anywhere]"
          key={record.signatureId}
          open={undefined}
        >
          <summary className="cursor-pointer font-medium">
            View signed waiver · {record.title} · version {record.version}
          </summary>
          <div className="mt-4 space-y-3">
            <p>
              {record.signerKind === 'guardian'
                ? 'Guardian signature verified by an officer'
                : 'Electronic signature'}
              : {record.signatureName}
            </p>
            <p>
              {record.guardianSignedOn
                ? `Guardian signed ${waiverDate(record.guardianSignedOn)}; verified ${new Date(record.signedAt).toLocaleString('en-US')}`
                : `Signed ${new Date(record.signedAt).toLocaleString('en-US')}`}
            </p>
            <p>
              Coverage: {waiverDate(record.validFrom)} through{' '}
              {waiverDate(record.validUntil)}
            </p>
            <p>Activities: {record.activity_scope.join(', ')}</p>
            {record.withdrawnAt && (
              <p>
                Withdrawn {new Date(record.withdrawnAt).toLocaleString('en-US')}{' '}
                for future trips.
              </p>
            )}
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              {record.body}
            </p>
          </div>
        </details>
      ))}
      {valid && !confirm && (
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Withdraw waiver for future trips
        </Button>
      )}
      {valid && confirm && (
        <div className="space-y-4 rounded border p-4">
          <h3 className="font-semibold">Withdraw annual waiver?</h3>
          <p>
            Your annual waiver will no longer count for future MTN Club trips.
            You’ll need to sign the current waiver again before participating in
            another covered trip.
          </p>
          <p>
            This does not delete the record of the waiver you previously signed
            or change activities that already occurred.
          </p>
          {state.upcomingRegistrations > 0 && (
            <p>
              Your {state.upcomingRegistrations} upcoming registration(s) will
              keep their RSVP status and require a valid waiver before
              participation.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirm(false)}
            >
              Keep waiver
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const result = await withdrawAnnualAction(valid.signatureId)
                    setMessage(result.message)
                    if (result.ok) {
                      setConfirm(false)
                      setSigning(false)
                      router.refresh()
                    }
                  } catch {
                    setMessage('Unable to withdraw. Please retry.')
                  }
                })
              }
            >
              Withdraw for future trips
            </Button>
          </div>
        </div>
      )}
      <output>{message}</output>
    </section>
  )
}
