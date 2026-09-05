'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  RegistrationSettingsInput,
  TripRegistrationSnapshot,
} from '@/lib/registration/schema'
import {
  createUnlvWaiver,
  unlvWaiverSource,
} from '@/lib/registration/unlv-waiver'

export function WaiverTemplatePicker({
  snapshot,
  onChange,
}: {
  snapshot: TripRegistrationSnapshot
  onChange: (value: Partial<RegistrationSettingsInput>) => void
}) {
  const [risks, setRisks] = useState('')
  return (
    <div className="space-y-2 rounded border p-3">
      <p className="text-sm">
        Use the UNLV RSO template. Describe the actual activity and possible
        injuries for this trip. Review the completed text before saving;
        requirements freeze after the first registration.
      </p>
      <Label htmlFor="waiver-risks">
        Activity-specific risks and possible injuries
      </Label>
      <Textarea
        id="waiver-risks"
        value={risks}
        onChange={e => setRisks(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={risks.trim().length < 20}
        onClick={() =>
          onChange({
            waiverTitle: `${snapshot.title} — UNLV RSO waiver`,
            waiverBody: createUnlvWaiver(
              snapshot.title,
              new Date(snapshot.startAt).toLocaleDateString('en-US', {
                timeZone: snapshot.timeZone,
              }),
              risks.trim(),
            ),
            waiverSourceUrl: unlvWaiverSource,
          })
        }
      >
        Fill UNLV waiver template
      </Button>
      <a
        href="/legal/unlv-rso-waiver-template-2022.docx"
        className="block text-sm underline"
      >
        Download original template for parent or guardian signing
      </a>
    </div>
  )
}
