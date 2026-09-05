'use client'

import { Check, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CopyTripLinkButton({
  tripId,
  className,
}: {
  tripId: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyLink() {
    const link = `${window.location.origin}/trips/${tripId}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      return
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = link
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        if (document.execCommand('copy')) setCopied(true)
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-8 shrink-0', className)}
      onClick={copyLink}
      aria-label={copied ? 'Trip link copied' : 'Copy trip link'}
      title={copied ? 'Trip link copied' : 'Copy trip link'}
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
    </Button>
  )
}
