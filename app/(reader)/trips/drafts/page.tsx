import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TripDraftsList } from '@/components/events/trip-drafts-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export default async function TripDraftsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?returnTo=${encodeURIComponent('/trips/drafts')}`)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:py-14">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You need a profile before you can create and manage trip drafts.
          </CardContent>
        </Card>
      </main>
    )
  }

  const { data: drafts, error: draftsError } = await supabase
    .from('trip_drafts')
    .select('*')
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })

  if (draftsError) {
    throw draftsError
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:py-14">
      <section className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Drafts</h1>
          <p className="text-sm text-muted-foreground">
            Save unfinished events and publish when ready.
          </p>
        </div>
        <Link href="/trips/new">
          <Button type="button" variant="outline" className="rounded-xl">
            + Event
          </Button>
        </Link>
      </section>

      <TripDraftsList drafts={drafts ?? []} />
    </main>
  )
}
