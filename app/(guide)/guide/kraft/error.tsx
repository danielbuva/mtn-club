'use client'

export default function KraftGuideError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-brand text-4xl uppercase">
        The guide could not open.
      </h1>
      <p className="my-4">
        Try again. If this edition is downloaded, refresh to open your saved
        guide.
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 border border-foreground px-5 focus-visible:outline-2"
      >
        Try again
      </button>
    </main>
  )
}
