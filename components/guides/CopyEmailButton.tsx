'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

type CopyEmailButtonProps = {
  value: string
}

export function CopyEmailButton({ value }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      return
    } catch {
      // fallback below
    }

    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
    } finally {
      document.body.removeChild(textarea)
    }
  }

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="inline-flex items-center gap-1 border border-border/60 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
      aria-label={copied ? 'Email copied' : 'Copy email'}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
