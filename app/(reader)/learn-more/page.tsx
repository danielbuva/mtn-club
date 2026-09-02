import type { Metadata, Viewport } from 'next'
import { startHereSections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export const metadata: Metadata = {
  title: 'Learn More | UNLV Mountain Club',
  description:
    'Learn what UNLV Mountain Club does, how trips work, and how to get involved.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

export default function LearnMorePage() {
  return <GuideShell sections={startHereSections} />
}
