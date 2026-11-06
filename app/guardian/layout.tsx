import type { Metadata, Viewport } from 'next'
import { GuardianShell } from '@/components/guardian/guardian-shell'

export const viewport: Viewport = { interactiveWidget: 'resizes-content' }
// Signing links carry a secret: never index them or leak them through referrers.
export const metadata: Metadata = {
  title: 'Guardian permission · UNLV Mountain Club',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <GuardianShell>{children}</GuardianShell>
}
