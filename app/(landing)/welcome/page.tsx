import type { Metadata, Viewport } from 'next'
import { WelcomePage } from '@/components/landing/welcome-page'

export const metadata: Metadata = {
  title: 'Welcome | UNLV Mountain Club',
  description:
    'Meet the UNLV Mountain Club, see weekly meetups and Fall 2026 trips, browse community links, and find out how to join.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

export default function Page() {
  return <WelcomePage />
}
