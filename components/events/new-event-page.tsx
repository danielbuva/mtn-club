'use client'

import Link from 'next/link'
import { EventForm } from '@/components/events/event-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { MembershipState } from '@/lib/memberships/types'

type NewEventPageProps = {
  initialType?: string
  membershipState: MembershipState
}

export function NewEventPage({
  initialType,
  membershipState,
}: NewEventPageProps) {
  const { isAuthenticated, isLeader, clubId, membershipId, error } =
    membershipState

  const initialIsOfficial = initialType === 'official' && isLeader

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {initialIsOfficial ? 'Add Official Trip' : 'Post a Meetup'}
            </h1>
            <p className="text-muted-foreground">
              Share a new event with the club calendar.
            </p>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {error}
                </CardContent>
              </Card>
            )}

            {!error && !isAuthenticated && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please sign in to create events.
                  </p>
                  <Link href="/auth/login">
                    <Button className="rounded-xl">Sign in</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {!error && isAuthenticated && (!clubId || !membershipId) && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  An active membership is required to post events.
                </CardContent>
              </Card>
            )}

            {!error && isAuthenticated && clubId && membershipId && (
              <EventForm
                clubId={clubId}
                membershipId={membershipId}
                canChooseOfficial={isLeader}
                initialIsOfficial={initialIsOfficial}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
