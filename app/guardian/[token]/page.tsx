import { Suspense } from 'react'
import { GuardianShellSkeleton } from '@/components/guardian/guardian-shell'
import { GuardianLinkNotice } from '@/components/guardian/link-notice'
import { SignedRecord } from '@/components/guardian/signed-record'
import { SigningFlow } from '@/components/guardian/signing-flow'
import { getGuardianView } from '@/lib/guardian/server'

async function GuardianRequest({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const view = await getGuardianView(token)
  switch (view.state) {
    case 'invalid':
      return <GuardianLinkNotice kind="invalid" />
    case 'closed':
      return (
        <GuardianLinkNotice
          kind="closed"
          participantName={view.participantName}
        />
      )
    case 'declined':
      return (
        <GuardianLinkNotice
          kind="declined"
          participantName={view.participantName}
        />
      )
    case 'signed':
      return <SignedRecord token={token} view={view} />
    case 'open':
      return <SigningFlow token={token} view={view} />
    default: {
      const unreachable: never = view
      return unreachable
    }
  }
}

export default function GuardianPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  return (
    <Suspense fallback={<GuardianShellSkeleton />}>
      <GuardianRequest params={params} />
    </Suspense>
  )
}
