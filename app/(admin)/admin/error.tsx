'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-5 py-10 sm:px-8">
      <div
        role="alert"
        className="w-full border border-destructive/25 bg-white/50 p-8 text-center dark:bg-card"
      >
        <AlertCircle
          className="mx-auto size-9 text-destructive"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-brand text-3xl uppercase">
          This admin view could not load
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Try the request again. If it keeps failing, confirm the latest
          Supabase migration is deployed and your role still has access to this
          workspace.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
      </div>
    </div>
  )
}
