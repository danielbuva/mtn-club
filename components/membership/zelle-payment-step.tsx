'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { ZELLE_PHONE_DISPLAY, ZELLE_PHONE_VALUE } from '@/lib/constants'

type CopyStatus = 'idle' | 'copied' | 'failed'

export function ZellePaymentStep() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  async function copyPhoneNumber() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard is unavailable.')
      await navigator.clipboard.writeText(ZELLE_PHONE_VALUE)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <section
      aria-labelledby="membership-payment-title"
      className="mt-8 grid gap-4 bg-[#211D18] p-6 text-[#F8F1DF] sm:grid-cols-[auto_1fr] sm:items-center sm:p-8"
    >
      <div className="sm:col-span-2">
        <p className="font-brand text-xs uppercase tracking-[0.2em] text-[#F8F1DF]/60">
          01
        </p>
        <h2
          id="membership-payment-title"
          className="mt-1 font-brand text-2xl uppercase text-[#F8F1DF]"
        >
          Pay dues
        </h2>
      </div>

      <div>
        <p className="font-brand text-5xl text-[#FFECA2]">$25</p>
        <p className="mt-1 text-sm text-[#F8F1DF]/60">for 12 months</p>
      </div>

      <div className="max-w-xl">
        <p className="leading-7 text-[#F8F1DF]/75">
          Send $25 through Zelle to{' '}
          <strong className="select-all whitespace-nowrap text-[#FFECA2]">
            {ZELLE_PHONE_DISPLAY}
          </strong>
          . Leadership matches it against the club account after you submit the
          form.
        </p>
        <button
          type="button"
          onClick={copyPhoneNumber}
          className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#F8F1DF]/35 px-3 text-sm font-semibold text-[#F8F1DF] outline-none transition hover:border-[#FFECA2] hover:text-[#FFECA2] focus-visible:ring-2 focus-visible:ring-[#FFECA2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211D18]"
        >
          {copyStatus === 'copied' ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copyStatus === 'copied' ? 'Number copied' : 'Copy Zelle number'}
        </button>
        <p
          aria-live="polite"
          className={
            copyStatus === 'failed'
              ? 'mt-2 text-xs text-[#F8F1DF]/60'
              : 'sr-only'
          }
        >
          {copyStatus === 'copied'
            ? 'Zelle number copied.'
            : copyStatus === 'failed'
              ? 'Copy is unavailable here. Press and hold the number above.'
              : ''}
        </p>
      </div>

      <p className="text-sm leading-6 text-[#F8F1DF]/65 sm:col-span-2">
        Not ready to pay yet? You can still submit the form and update your dues
        status later.
      </p>
    </section>
  )
}
