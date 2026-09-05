'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setRegistrationEnabledAction } from '@/lib/registration/actions'
export function RegistrationSwitch({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const router = useRouter()
  return (
    <div className="space-y-3">
      <p>New registrations: {enabled ? 'enabled' : 'paused'}</p>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await setRegistrationEnabledAction(!enabled)
              setMessage(result.message)
              router.refresh()
            } catch {
              setMessage('Could not change registration availability.')
            }
          })
        }
      >
        {enabled ? 'Pause new registration' : 'Enable new registration'}
      </Button>
      <p className="text-sm">
        Pausing preserves status access, cancellations, and acceptance of valid
        outstanding offers.
      </p>
      <output>{message}</output>
    </div>
  )
}
