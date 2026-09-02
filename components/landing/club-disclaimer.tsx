import { CLUB_DISCLAIMER } from '@/lib/club-content'

export function ClubDisclaimer({ id }: { id?: string }) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="border-t border-current/15 px-5 py-8 text-current/65"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id={id ? `${id}-title` : undefined}
          className="font-brand text-sm uppercase tracking-[0.18em] text-current/80"
        >
          Student-run and independent
        </h2>
        <p className="mt-3 max-w-4xl text-xs leading-6 sm:text-sm">
          {CLUB_DISCLAIMER}
        </p>
      </div>
    </section>
  )
}
