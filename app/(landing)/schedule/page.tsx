import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import {
  TripScheduleList,
  TripScheduleSkeleton,
  TripScheduleUnavailable,
} from '@/components/landing/trip-schedule-list'
import { TripSchedulePage } from '@/components/landing/trip-schedule-page'
import { getOfficialSchedule } from '@/lib/events/official-schedule'
import { createPublicClient } from '@/lib/supabase/public'

export const metadata: Metadata = {
  title: 'Official Trip Schedule | UNLV Mountain Club',
  description:
    'See the UNLV Mountain Club weekly meetups and official trip schedule.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#211D18',
}

async function TripScheduleContent() {
  await connection()
  try {
    const trips = await getOfficialSchedule(createPublicClient())
    return <TripScheduleList trips={trips} />
  } catch (error) {
    console.error('Official trip schedule unavailable.', error)
    return <TripScheduleUnavailable />
  }
}

export default function Page() {
  return (
    <TripSchedulePage>
      <Suspense fallback={<TripScheduleSkeleton />}>
        <TripScheduleContent />
      </Suspense>
    </TripSchedulePage>
  )
}
