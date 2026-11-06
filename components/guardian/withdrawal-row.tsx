'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { acknowledgeWithdrawalAction } from '@/lib/guardian/review-actions'
import type { ReviewQueue } from '@/lib/guardian/schema'
import { TextButton } from './ui'

export function WithdrawalRow({
  item,
}: {
  item: ReviewQueue['withdrawals'][number]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [message, setMessage] = useState('')
  const what = [
    item.membership ? 'membership' : null,
    item.waiver ? 'activity waiver' : null,
  ]
    .filter(Boolean)
    .join(' and ')
  return (
    <li className="space-y-1 py-3">
      <p className="text-base leading-6">
        <span className="font-medium">{item.guardianName}</span> withdrew {what}{' '}
        for <span className="font-medium">{item.participantName}</span>.
      </p>
      {item.note && (
        <p className="text-sm text-muted-foreground">“{item.note}”</p>
      )}
      <p className="text-sm text-muted-foreground">
        The waiver stopped counting right away.
        {item.membership ? ' Update membership status if needed.' : ''}
      </p>
      <TextButton
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await acknowledgeWithdrawalAction(item.id)
            setMessage(result.message)
            if (result.ok) router.refresh()
          })
        }
      >
        {pending ? 'Saving…' : 'Mark handled'}
      </TextButton>
      {message && <output className="block text-sm">{message}</output>}
    </li>
  )
}
