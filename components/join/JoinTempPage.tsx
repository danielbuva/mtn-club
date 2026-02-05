import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import { CopyEmailButton } from '@/components/guides/CopyEmailButton'
import { DISCORD_INVITE_URL, INSTAGRAM_URL } from '@/lib/constants'

const INVOLVEMENT_CENTER_URL =
  'https://involvementcenter.unlv.edu/organization/unlvmountainclub'

const EMAIL = 'unlvmountainclub@gmail.com'

export function JoinTempPage() {
  return (
    <div className="px-4 pb-24 pt-12">
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden">
        <div className="rounded-full border border-border/50 bg-background/80 backdrop-blur">
          <BackButton className="px-4 py-2 text-xs text-foreground/70 lowercase whitespace-nowrap" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold">
            Join UNLV Mountain Club Steps
          </h2>
          <ol className="space-y-3 pl-4 text-sm md:text-base leading-7 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary tabular-nums">1.</span>
              <span>
                Join{' '}
                <Link
                  href={DISCORD_INVITE_URL}
                  className="underline decoration-foreground/30 underline-offset-4 transition hover:text-foreground"
                >
                  Discord
                </Link>{' '}
                to see trips and announcements.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary tabular-nums">2.</span>
              <span>
                If you are a UNLV student, join us in the{' '}
                <Link
                  href={INVOLVEMENT_CENTER_URL}
                  className="underline decoration-foreground/30 underline-offset-4 transition hover:text-foreground"
                >
                  Involvement Center
                </Link>
                .
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary tabular-nums">3.</span>
              <span>
                Follow{' '}
                <Link
                  href={INSTAGRAM_URL}
                  className="underline decoration-foreground/30 underline-offset-4 transition hover:text-foreground"
                >
                  Instagram
                </Link>{' '}
                for updates and photos.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary tabular-nums">4.</span>
              <span>Email us if you want to join.</span>
            </li>
          </ol>
        </section>

        <section className="rounded-2xl border border-border/60 bg-secondary/20 p-5 md:p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Note
          </p>
          <p className="mt-2 text-sm md:text-base leading-7 text-foreground/90">
            Our PayPal is down right now, so we are not accepting payments yet.
            If you want to become a member, email us and we will get you set up.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <a
              href={`mailto:${EMAIL}`}
              className="font-medium underline decoration-foreground/30 underline-offset-4 transition hover:text-foreground"
            >
              {EMAIL}
            </a>
            <CopyEmailButton value={EMAIL} />
          </div>
        </section>
      </div>
    </div>
  )
}
