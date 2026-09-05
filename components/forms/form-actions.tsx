'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FormActions({
  onBack,
  primaryLabel = 'Continue',
  pending,
  disabled,
  placement = 'inline',
  secondary,
}: {
  onBack?: () => void
  primaryLabel?: string
  pending?: boolean
  disabled?: boolean
  placement?: 'sticky' | 'inline'
  secondary?: ReactNode
}) {
  const root = useRef<HTMLDivElement>(null)
  const [hasSpace, setHasSpace] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const measure = () => {
      const actionHeight = root.current?.offsetHeight ?? 0
      // Reserve room for the question and controls in the actually visible viewport.
      const form = root.current?.closest('form')
      const formTop =
        form?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const contentHeight = form?.scrollHeight ?? Number.POSITIVE_INFINITY
      setHasSpace(
        viewport.height > actionHeight + 360 &&
          viewport.height >= contentHeight + 32 &&
          formTop <= viewport.offsetTop + 48,
      )
    }
    measure()
    viewport.addEventListener('resize', measure)
    viewport.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    const form = root.current?.closest('form')
    if (form) observer.observe(form)
    return () => {
      viewport.removeEventListener('resize', measure)
      viewport.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [])
  return (
    <div
      ref={root}
      data-form-actions
      className={cn(
        'relative z-10 space-y-4 bg-background py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        placement === 'sticky' && hasSpace && 'sticky bottom-0 mt-auto',
      )}
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-12 px-4"
            onClick={onBack}
            disabled={pending}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          className="ml-auto min-h-12 min-w-40 px-7 text-base"
          disabled={pending || disabled}
        >
          {pending ? 'Saving…' : primaryLabel}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      {secondary && (
        <div className="flex flex-wrap items-center justify-between gap-3 [&>*:last-child]:ml-auto">
          {secondary}
        </div>
      )}
    </div>
  )
}
