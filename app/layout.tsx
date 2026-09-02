import type { Metadata, Viewport } from 'next'
import { Archivo_Narrow, Geist } from 'next/font/google'
// MapLibre styles should be loaded once at the app root.
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'
import { Providers } from './providers'

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://unlvmountainclub.com')

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'UNLV Mountain Club',
  description:
    'The official website of the UNLV Mountain Club, dedicated to outdoor adventures and community building.',
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F1DF' },
    { media: '(prefers-color-scheme: dark)', color: '#28211D' },
  ],
}

const initialThemeScript = `
(() => {
  const applyStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem('theme')
      const theme =
        storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system'
          ? storedTheme
          : 'light'
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const root = document.documentElement

      root.classList.remove('light', 'dark')
      root.classList.add(isDark ? 'dark' : 'light')
      root.style.colorScheme = isDark ? 'dark' : 'light'
    } catch {
      document.documentElement.classList.add('light')
      document.documentElement.style.colorScheme = 'light'
    }
  }

  applyStoredTheme()
  window.addEventListener('pageshow', applyStoredTheme)
})()
`

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
})

const brand = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-brand',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The theme class must exist before Safari paints a restored page. */}
        <script id="initial-theme">{initialThemeScript}</script>
      </head>
      <body className={`${geistSans.className} ${brand.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
