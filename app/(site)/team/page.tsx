import { Heart, Mail, Mountain } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CLUB_EMAIL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

export default async function TeamPage() {
  const supabase = await createClient()
  const leaders = await supabase
    .from('club_hosts')
    .select('id, public_name, club_title')
    .eq('is_active', true)
    .order('display_order')
    .order('public_name')

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="public-page-top bg-secondary/30 px-4 pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-sm font-medium uppercase tracking-wider text-primary">
              Our Team
            </span>
            <h1 className="mt-2 mb-4 text-balance text-4xl font-bold md:text-5xl">
              Meet the Mountain Club Leadership
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              The student leaders who organize trips, support members, and keep
              the club moving.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/membership-sign-up">Become a member</Link>
              </Button>
              <Button variant="secondary" asChild className="rounded-xl">
                <Link href="/learn-more">Learn more</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-24">
          <div className="mx-auto max-w-6xl">
            {leaders.error ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                We could not load the leadership roster. Please try again soon.
              </div>
            ) : (leaders.data ?? []).length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(leaders.data ?? []).map(leader => (
                  <Card
                    key={leader.id}
                    className="overflow-hidden border-border/50 bg-card"
                  >
                    <CardContent className="flex items-center gap-5 p-6">
                      <div
                        className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-brand text-2xl text-primary"
                        aria-hidden="true"
                      >
                        {initials(leader.public_name)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          {leader.public_name}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {leader.club_title}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                The current leadership roster will be posted here soon.
              </div>
            )}
          </div>
        </section>

        <section className="bg-secondary/30 px-4 py-24">
          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center gap-8 md:flex-row">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary/10">
                    <Heart
                      className="size-10 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-balance text-2xl font-bold md:text-3xl">
                      Interested in Joining Leadership?
                    </h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      Tell us how you would like to help with trips, gear,
                      member support, or club operations.
                    </p>
                    <Button size="lg" className="mt-6 rounded-xl gap-2" asChild>
                      <a href={`mailto:${CLUB_EMAIL}`}>
                        <Mail className="size-4" /> Contact the club
                      </a>
                    </Button>
                  </div>
                  <Mountain
                    className="hidden size-20 text-primary/15 lg:block"
                    aria-hidden="true"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
