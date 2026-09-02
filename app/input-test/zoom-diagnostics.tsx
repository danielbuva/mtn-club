'use client'

import { useEffect, useMemo, useState } from 'react'

type FocusSample = {
  label: string
  before: number
  after: number
}

const readScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }
  return window.visualViewport?.scale ?? 1
}

export function InputZoomDiagnostics() {
  const [scale, setScale] = useState<number>(readScale())
  const [samples, setSamples] = useState<FocusSample[]>([])

  useEffect(() => {
    const onResize = () => setScale(readScale())
    window.visualViewport?.addEventListener('resize', onResize)
    window.addEventListener('resize', onResize)
    return () => {
      window.visualViewport?.removeEventListener('resize', onResize)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const roundedScale = useMemo(() => Math.round(scale * 1000) / 1000, [scale])

  const captureFocus = (label: string) => {
    const before = readScale()
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const after = readScale()
        setScale(after)
        setSamples(current =>
          [{ label, before, after }, ...current].slice(0, 6),
        )
      })
    })
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-lg font-semibold">Input Zoom Diagnostic</h1>
      <p className="text-sm text-muted-foreground">
        Current scale: {roundedScale}
      </p>

      <div className="space-y-3 rounded-md border border-border p-3">
        <label htmlFor="plain-input" className="block text-sm">
          Plain input
        </label>
        <input
          id="plain-input"
          type="text"
          onFocus={() => captureFocus('plain')}
          className="h-10 w-full rounded-md border border-input px-3"
        />
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <label htmlFor="fixed-input" className="block text-sm">
          Fixed 16px + no transform input
        </label>
        <input
          id="fixed-input"
          type="text"
          onFocus={() => captureFocus('fixed16')}
          className="h-10 w-full rounded-md border border-input px-3 text-[16px] [transform:none]"
        />
      </div>

      <div className="rounded-md border border-border p-3">
        <p className="text-sm font-medium">Recent focus samples</p>
        {samples.length ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {samples.map((sample, index) => (
              <li key={`${sample.label}-${index}`}>
                {sample.label}: {sample.before.toFixed(3)} -&gt;{' '}
                {sample.after.toFixed(3)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Focus an input to capture a sample.
          </p>
        )}
      </div>
    </section>
  )
}
