import Link from 'next/link'
import { Button } from '@/components/ui/button'

type ComingSoonPageProps = {
  searchParams?: {
    from?: string
  }
}

export default function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const from = searchParams?.from

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              UNLV Mountain Club
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold">Coming soon</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              We’re shipping membership onboarding + dues first. Trips,
              calendar, gear closet, maps, RSVPs are coming soon.
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
              <Link href="/membership">Go to Membership</Link>
            </Button>
            <Button variant="secondary" asChild className="rounded-xl">
              <Link href="/get-started">Get Started</Link>
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
      </main>
    </div>
  )
}
