import { Suspense } from 'react'
import { InformedRiskEditor } from '@/components/registration/informed-risk-editor'
import {
  RegistrationShell,
  RegistrationSkeleton,
} from '@/components/registration/page-shell'
import { getRoster } from '@/lib/registration/server'

async function Editor({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const { snapshot } = await getRoster(tripId)
  return <InformedRiskEditor snapshot={snapshot} initiallyOpen />
}
export default function InformedRisksPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  return (
    <RegistrationShell title="Informed risks">
      <Suspense fallback={<RegistrationSkeleton />}>
        <Editor params={params} />
      </Suspense>
    </RegistrationShell>
  )
}
