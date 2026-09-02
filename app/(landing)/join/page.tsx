import type { Metadata, Viewport } from 'next'
import { JoinPage } from '@/components/landing/join-page'

export const metadata: Metadata = {
  title: 'Join | UNLV Mountain Club',
  description:
    'Join the Mountain Club community, follow club updates, register with UNLV, or learn about annual membership.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

export default function Page() {
  return <JoinPage />
}
