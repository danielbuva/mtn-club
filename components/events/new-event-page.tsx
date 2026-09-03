'use client'

import Link from 'next/link'
import { EventForm } from '@/components/events/event-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Database } from '@/lib/supabase/types'

type NewEventPageProps = {
  initialType?: string
  initialDraft: Database['public']['Tables']['trip_drafts']['Row'] | null
  isAuthenticated: boolean
  canCreateOfficial: boolean
  canManageTags: boolean
  activityOptions: string[]
  publicHostOptions?: Array<{ id: string; label: string }>
  leaderOptions?: Array<{ id: string; label: string }>
  successPath?: string
}

export function NewEventPage({
  initialType,
  initialDraft,
  isAuthenticated,
  canCreateOfficial,
  canManageTags,
  activityOptions,
  publicHostOptions = [],
  leaderOptions = [],
  successPath = '/trips',
}: NewEventPageProps) {
  const initialIsOfficial = initialType === 'official' && canCreateOfficial

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-4 py-8">
        <section>
          <div className="max-w-3xl mx-auto">
            {!isAuthenticated && (
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

            {isAuthenticated && (
              <EventForm
                canChooseOfficial={canCreateOfficial}
                canManageTags={canManageTags}
                initialIsOfficial={initialIsOfficial}
                initialDraft={initialDraft}
                activityOptions={activityOptions}
                publicHostOptions={publicHostOptions}
                leaderOptions={leaderOptions}
                successPath={successPath}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
