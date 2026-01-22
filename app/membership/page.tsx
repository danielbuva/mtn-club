import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getViewer } from '@/lib/auth/viewer'
import { MembershipActive } from './_components/membership-active'
import { MembershipActivate } from './_components/membership-activate'
import { MembershipMarketing } from './_components/membership-marketing'

export default async function MembershipPage() {
  const viewer = await getViewer()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {viewer.isMember ? (
        <MembershipActive viewer={viewer} />
      ) : viewer.isAuthenticated ? (
        <MembershipActivate />
      ) : (
        <MembershipMarketing />
      )}
      <Footer />
    </div>
  )
}
