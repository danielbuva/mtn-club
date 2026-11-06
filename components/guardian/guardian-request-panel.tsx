'use client'
import { Mail, MonitorSmartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CLUB_EMAIL } from '@/lib/constants'
import {
  cancelGuardianRequestAction,
  startSameDeviceAction,
} from '@/lib/guardian/participant-actions'
import {
  type GuardianPresentation,
  membershipPresentation,
} from '@/lib/guardian/presentation'
import type { GuardianStatus } from '@/lib/guardian/schema'
import { InviteForm } from './invite-form'
import { Eyebrow, GuardianTag, LineButton, Notice, TextButton } from './ui'

const sentAt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  })

const choiceClass =
  'h-auto min-h-16 flex-col items-start gap-1 px-4 py-3 text-left normal-case tracking-normal'

/**
 * The minor's view of guardian permission: status in words, and the two ways
 * to get a signature (this device, or an emailed link).
 * `compact` (profile) leaves the detailed breakdown to the page around it.
 */
export function GuardianRequestPanel({
  status,
  presentation,
  tripId,
  compact = false,
}: {
  status: GuardianStatus
  presentation: GuardianPresentation
  tripId: string | null
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [mode, setMode] = useState<'choose' | 'invite' | 'cancel'>('choose')
  const [message, setMessage] = useState('')
  const membership = compact ? null : membershipPresentation(status.membership)
  const invite = status.request?.inviteSentAt ? status.request : null
  const waiting = presentation.tone === 'waiting' && invite
  const canResend = invite?.nextInviteAt
    ? new Date(invite.nextInviteAt) <= new Date()
    : true
  const coverage = status.tripCoverage ?? status.waiver.current
  return (
    <section
      aria-labelledby="guardian-panel-heading"
      className="space-y-5 border-t border-foreground/80 pt-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        {!compact && <Eyebrow>Guardian permission</Eyebrow>}
        <GuardianTag label={presentation.label} tone={presentation.tone} />
      </div>
      <div className="space-y-3">
        <h2
          id="guardian-panel-heading"
          className="font-brand text-3xl font-bold uppercase leading-none tracking-wide"
        >
          {presentation.headline}
        </h2>
        {presentation.clubNote && (
          <blockquote className="border-l-2 border-foreground py-1 pl-4">
            <p className="font-brand text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              From the club
            </p>
            <p className="mt-1 text-base leading-7">
              “{presentation.clubNote}”
            </p>
          </blockquote>
        )}
        <p className="max-w-xl text-base leading-7">{presentation.body}</p>
        {presentation.contactClub && (
          <a
            className="inline-flex min-h-11 items-center underline underline-offset-4"
            href={`mailto:${CLUB_EMAIL}`}
          >
            Email the club
          </a>
        )}
      </div>
      {!compact && coverage && presentation.canRequest && !waiting && (
        <p className="text-sm leading-6 text-muted-foreground">
          This year’s waiver covers {coverage.activities.join(', ')}, July 1 to
          June 30. Other activities need their own waiver.
        </p>
      )}
      {membership && membership.tone !== 'ready' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border py-3 text-base">
          <span className="font-medium">Membership permission</span>
          <GuardianTag label={membership.label} tone={membership.tone} />
          <span className="basis-full text-sm leading-6 text-muted-foreground">
            {membership.body}
          </span>
        </div>
      )}
      {waiting && mode !== 'invite' && (
        <div className="space-y-2">
          <p className="text-base leading-7">
            Sent to{' '}
            <span className="font-semibold [overflow-wrap:anywhere]">
              {invite.invitedEmail}
            </span>{' '}
            on {sentAt(invite.inviteSentAt ?? '')}.
          </p>
          {mode === 'cancel' ? (
            <div className="space-y-3 border-l-2 border-foreground pl-4">
              <p className="text-base leading-7">
                Cancel the request? Their link stops working.
              </p>
              <div className="flex flex-wrap gap-x-6">
                <TextButton
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const result = await cancelGuardianRequestAction(tripId)
                      setMessage(result.message)
                      setMode('choose')
                      router.refresh()
                    })
                  }
                >
                  {pending ? 'Canceling…' : 'Yes, cancel it'}
                </TextButton>
                <TextButton
                  disabled={pending}
                  onClick={() => setMode('choose')}
                >
                  Keep it
                </TextButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6">
              <TextButton
                disabled={pending || !canResend || invite.inviteCount >= 5}
                onClick={() => setMode('invite')}
              >
                {invite.inviteCount >= 5
                  ? 'Resend limit reached'
                  : canResend
                    ? 'Resend or change email'
                    : `Resend after ${sentAt(invite.nextInviteAt ?? '')}`}
              </TextButton>
              <TextButton disabled={pending} onClick={() => setMode('cancel')}>
                Cancel request
              </TextButton>
            </div>
          )}
        </div>
      )}
      {presentation.canRequest && mode === 'choose' && !waiting && (
        <div className="grid gap-3 sm:grid-cols-2">
          <LineButton
            disabled={pending}
            className={choiceClass}
            onClick={() =>
              start(async () => {
                const result = await startSameDeviceAction(tripId)
                if (result.ok && result.href) router.push(result.href)
                else setMessage(result.message)
              })
            }
          >
            <span className="flex items-center gap-2 font-brand text-base font-bold uppercase tracking-[0.06em]">
              <MonitorSmartphone aria-hidden="true" />{' '}
              {pending ? 'Opening…' : 'They’re with me'}
            </span>
            <span className="font-sans text-sm font-normal text-muted-foreground">
              They sign on this device now.
            </span>
          </LineButton>
          <LineButton
            disabled={pending}
            className={choiceClass}
            onClick={() => setMode('invite')}
          >
            <span className="flex items-center gap-2 font-brand text-base font-bold uppercase tracking-[0.06em]">
              <Mail aria-hidden="true" /> Email them a link
            </span>
            <span className="font-sans text-sm font-normal text-muted-foreground">
              They sign on their own phone or computer.
            </span>
          </LineButton>
        </div>
      )}
      {mode === 'invite' && (
        <InviteForm
          tripId={tripId}
          guardian={status.guardian}
          onCancel={() => setMode('choose')}
          submitLabel={invite ? 'Resend link' : 'Send link'}
        />
      )}
      <Notice tone="info">{message}</Notice>
    </section>
  )
}
