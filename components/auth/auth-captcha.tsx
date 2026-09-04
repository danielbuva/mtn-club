'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

export function AuthCaptcha({
  onTokenChange,
  action,
  disabled = false,
}: {
  onTokenChange: (token: string) => void
  action: string
  disabled?: boolean
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const ref = useRef<TurnstileInstance>(null)
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scriptFailed, setScriptFailed] = useState(false)
  const previousAppearance = useRef('')
  const widgetReady = useRef(false)
  const [size, setSize] = useState<'compact' | 'flexible'>('compact')
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (!siteKey) return
    const timeout = window.setTimeout(() => {
      if (widgetReady.current) return
      onTokenChange('')
      setScriptFailed(true)
      setError(
        'The security check is taking longer than expected. Check your connection, then reload it.',
      )
    }, 15000)
    return () => window.clearTimeout(timeout)
  }, [siteKey, onTokenChange])
  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(entries =>
      setSize(
        (entries[0]?.contentRect.width ?? 0) < 300 ? 'compact' : 'flexible',
      ),
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const appearance = `${size}-${resolvedTheme}`
    if (previousAppearance.current !== appearance) {
      previousAppearance.current = appearance
      onTokenChange('')
    }
  }, [size, resolvedTheme, onTokenChange])
  const failed = () => {
    onTokenChange('')
    setError(
      'The security check could not load. Check your connection, then retry.',
    )
  }
  return (
    <div ref={container} className="min-w-0 space-y-2" aria-live="polite">
      {!siteKey ? (
        <p
          aria-live="polite"
          className="border border-border p-3 text-sm leading-6 text-muted-foreground"
        >
          Email authentication is temporarily unavailable. Use Google or
          Discord, or contact the club.
        </p>
      ) : (
        <>
          <Turnstile
            key={`${size}-${resolvedTheme}`}
            ref={ref}
            onWidgetLoad={() => {
              widgetReady.current = true
              setScriptFailed(false)
            }}
            siteKey={siteKey}
            options={{
              action,
              size,
              theme: resolvedTheme === 'dark' ? 'dark' : 'light',
              responseFieldName: 'captchaToken',
            }}
            onSuccess={token => {
              setError(null)
              onTokenChange(token)
            }}
            onExpire={() => {
              onTokenChange('')
              setError(
                'The security check expired. It will refresh automatically.',
              )
            }}
            onTimeout={failed}
            onError={failed}
            scriptOptions={{
              onError: () => {
                setScriptFailed(true)
                failed()
              },
            }}
          />
          {error && (
            <div
              aria-live="polite"
              className="text-sm leading-6 text-muted-foreground"
            >
              {error}{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (scriptFailed) {
                    window.location.reload()
                    return
                  }
                  setError(null)
                  onTokenChange('')
                  ref.current?.reset()
                }}
                className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {scriptFailed
                  ? 'Reload security check'
                  : 'Retry security check'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
