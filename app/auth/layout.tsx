import type { Metadata, Viewport } from 'next'
export const viewport: Viewport = {
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
