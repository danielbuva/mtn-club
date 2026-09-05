'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function WaiverReader({
  title,
  body,
  version,
  hasRead,
  onRead,
  error,
}: {
  title: string
  body: string
  version: number
  hasRead: boolean
  onRead: () => void
  error?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const document = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const titleId = useId()
  const helpId = useId()
  const [open, setOpen] = useState(false)
  const [reachedEnd, setReachedEnd] = useState(hasRead)
  useEffect(() => {
    if (!open) return
    const reader = dialog.current
    const content = document.current
    if (!reader || !content) return
    reader.showModal()
    heading.current?.focus()
    const previousOverflow = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    const measure = () => {
      if (content.scrollHeight - content.clientHeight - content.scrollTop <= 8)
        setReachedEnd(true)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => {
      observer.disconnect()
      window.document.body.style.overflow = previousOverflow
      reader.close()
    }
  }, [open])
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? helpId : undefined}
        onClick={() => setOpen(true)}
      >
        {hasRead ? 'Read waiver again' : 'Read full waiver'}
      </Button>
      <p
        id={helpId}
        className="min-h-5 text-sm text-destructive"
        role={error ? 'alert' : undefined}
      >
        {error}
      </p>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => {
          if (reachedEnd) onRead()
          setOpen(false)
        }}
        className="waiver-reader-dialog fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none flex-col bg-background p-0 text-foreground backdrop:bg-black/60 open:flex md:m-auto md:h-[85dvh] md:max-w-3xl md:border md:border-foreground/20"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-foreground/15 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Waiver · Version {version}
            </p>
            <h2
              ref={heading}
              id={titleId}
              tabIndex={-1}
              className="font-brand text-2xl outline-none"
            >
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0"
            onClick={() => dialog.current?.close()}
          >
            Close
          </Button>
        </header>
        <section
          ref={document}
          aria-label="Full waiver document"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this document.
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 outline-offset-[-4px] md:px-8"
          onScroll={event => {
            const element = event.currentTarget
            if (
              element.scrollHeight - element.clientHeight - element.scrollTop <=
              8
            )
              setReachedEnd(true)
          }}
        >
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
            {body}
          </p>
          <p className="mt-8 border-t border-foreground/15 pt-4 text-sm text-muted-foreground">
            End of waiver · Version {version}
          </p>
        </section>
        <footer className="shrink-0 space-y-3 border-t border-foreground/15 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {reachedEnd
              ? 'Return to the form to complete your details and agree. Nothing has been signed yet.'
              : 'Read through the document to the end before continuing.'}
          </p>
          <Button
            type="button"
            className="min-h-12 w-full"
            disabled={!reachedEnd}
            onClick={() => {
              dialog.current?.close()
            }}
          >
            Return to form
          </Button>
        </footer>
      </dialog>
    </>
  )
}
