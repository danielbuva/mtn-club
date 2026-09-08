import { Suspense } from 'react'
import announcementStyles from '@/components/announcements/announcement.module.css'
import { AnnouncementCard } from '@/components/announcements/announcement-card'
import HomeCover, { HomeCoverNavigation } from '@/components/home/HomeCover'
import { getActiveAnnouncement } from '@/lib/announcements/queries'
import { getViewer } from '@/lib/auth/viewer'

async function ViewerHomeCoverNavigation() {
  const viewer = await getViewer()
  return (
    <HomeCoverNavigation
      isAuthenticated={viewer.isAuthenticated}
      isAdmin={viewer.isAdmin}
    />
  )
}

async function HomepageAnnouncement() {
  const announcement = await getActiveAnnouncement()
  return announcement ? (
    <aside
      aria-label="Club announcement"
      data-home-announcement
      className={announcementStyles.placement}
    >
      <AnnouncementCard announcement={announcement} />
    </aside>
  ) : null
}

export default function HomePage() {
  return (
    <HomeCover
      announcement={
        <Suspense fallback={null}>
          <HomepageAnnouncement />
        </Suspense>
      }
      navigation={
        <Suspense fallback={null}>
          <ViewerHomeCoverNavigation />
        </Suspense>
      }
    />
  )
}
