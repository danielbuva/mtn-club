'use client'
import { GuardianHeading } from '@/components/guardian/guardian-shell'
import { InkButton } from '@/components/guardian/ui'
import { CLUB_EMAIL } from '@/lib/constants'

export default function GuardianError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-8">
      <GuardianHeading title="This page didn’t load.">
        <p>
          Nothing was signed. Try again in a moment. If it keeps happening,
          email{' '}
          <a
            className="underline underline-offset-4"
            href={`mailto:${CLUB_EMAIL}`}
          >
            {CLUB_EMAIL}
          </a>
          .
        </p>
      </GuardianHeading>
      <InkButton onClick={reset}>Try again</InkButton>
    </div>
  )
}
