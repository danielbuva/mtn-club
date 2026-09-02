import Link from 'next/link'
import { Suspense } from 'react'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'

type ComingSoonPageProps = {
  searchParams?:
    | {
        from?: string
      }
    | Promise<{
        from?: string
      }>
}

export default function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen">
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
        <BackButton />
        <div aria-hidden="true" />
      </div>
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Suspense fallback={<ComingSoonContent />}>
          <ComingSoonContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}

async function ComingSoonContent({ searchParams }: ComingSoonPageProps) {
  const resolvedSearchParams = await searchParams
  const from = resolvedSearchParams?.from

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          UNLV Mountain Club
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold">Coming soon</h1>
        <p className="text-base md:text-lg text-muted-foreground">
          We’re shipping membership onboarding + dues first. Trips, calendar,
          gear closet, maps, RSVPs are coming soon.
        </p>
        {from ? (
          <p className="text-sm text-muted-foreground">
            You tried to visit:{' '}
            <span className="font-medium text-foreground">{from}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="rounded-xl">
          <Link href="/membership-sign-up">Membership sign up</Link>
        </Button>
        <Button variant="secondary" asChild className="rounded-xl">
          <Link href="/learn-more">Learn More</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href="/about">About</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href="/team">Team</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-xl">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
