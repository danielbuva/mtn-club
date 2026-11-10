import { FieldNote } from '@/components/editorial/field-note'
import { MastheadEntry } from '@/components/team/masthead-entry'
import { CLUB_EMAIL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

const action =
  'inline-flex min-h-11 items-center justify-center border border-foreground px-5 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4'

export default async function TeamPage() {
  const supabase = await createClient()
  const leaders = await supabase
    .from('club_hosts')
    .select('id, public_name, club_title')
    .eq('is_active', true)
    .order('display_order')
    .order('public_name')

  return (
    <main className="public-page-top bg-background px-4 pb-16 text-foreground sm:px-6 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-foreground/80 pb-10 md:pb-14">
          <p className="mb-7 border-b border-foreground/80 pb-4 font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Our team
          </p>
          <h1 className="font-brand text-6xl font-bold uppercase leading-none tracking-tight md:text-8xl">
            The masthead
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            The student leaders who organize trips, support members, and keep
            the club moving.
          </p>
        </header>

        <section
          aria-label="Mountain Club leadership"
          className="pb-12 md:pb-20"
        >
          {leaders.error ? (
            <div className="border-b border-border py-10">
              <FieldNote label="Roster unavailable">
                We could not load the leadership roster. Please try again soon.
              </FieldNote>
            </div>
          ) : (leaders.data ?? []).length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              {(leaders.data ?? []).map(leader => (
                <MastheadEntry
                  key={leader.id}
                  name={leader.public_name}
                  role={leader.club_title}
                />
              ))}
            </div>
          ) : (
            <div className="border-b border-border py-10">
              <FieldNote label="The next edition">
                The current leadership roster will be posted here soon.
              </FieldNote>
            </div>
          )}
        </section>

        <section
          aria-labelledby="join-leadership"
          className="border border-foreground/80 p-6 md:p-10"
        >
          <p className="mb-6 border-b border-border pb-3 font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            A call for contributors
          </p>
          <div className="grid gap-6 md:grid-cols-2 md:gap-12">
            <h2
              id="join-leadership"
              className="font-brand text-4xl font-bold uppercase leading-none md:text-5xl"
            >
              Interested in joining leadership?
            </h2>
            <div>
              <p className="leading-relaxed text-muted-foreground">
                Tell us how you would like to help with trips, gear, member
                support, or club operations.
              </p>
              <a
                href={`mailto:${CLUB_EMAIL}`}
                className={`${action} mt-6 border-(--editorial-inverse) bg-(--editorial-inverse) text-(--editorial-highlight)`}
              >
                Contact the club
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
