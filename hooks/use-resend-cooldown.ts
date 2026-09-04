'use client'
import { useEffect, useRef, useState } from 'react'
export function useResendCooldown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const deadline = useRef(Date.now() + initialSeconds * 1000)
  useEffect(() => {
    if (remaining <= 0) return
    const timeout = window.setTimeout(
      () =>
        setRemaining(
          Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
        ),
      1000,
    )
    return () => window.clearTimeout(timeout)
  }, [remaining])
  return {
    remaining,
    start: () => {
      deadline.current = Date.now() + 60_000
      setRemaining(60)
    },
  }
}
