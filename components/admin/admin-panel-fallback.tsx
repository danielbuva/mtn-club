import type { AdminView } from '@/lib/admin/views'
import { AnalyticsLoading } from './loading/analytics'
import { LeadershipLoading, SettingsLoading } from './loading/forms'
import { GalleryLoading } from './loading/gallery'
import {
  AccountsLoading,
  MailingLoading,
  MembershipLoading,
  TripsLoading,
} from './loading/lists'
import { OverviewLoading } from './loading/overview'

const panels = {
  overview: OverviewLoading,
  trips: TripsLoading,
  membership: MembershipLoading,
  accounts: AccountsLoading,
  analytics: AnalyticsLoading,
  mailing: MailingLoading,
  gallery: GalleryLoading,
  leadership: LeadershipLoading,
  settings: SettingsLoading,
} satisfies Record<AdminView, () => React.ReactNode>

export function AdminPanelFallback({ view }: { view: AdminView }) {
  const Panel = panels[view]
  return (
    <div aria-busy="true">
      <output className="sr-only">
        Loading {view === 'mailing' ? 'mailing list' : view} data…
      </output>
      <Panel />
    </div>
  )
}
