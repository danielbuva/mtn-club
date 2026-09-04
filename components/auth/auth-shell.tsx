import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  AuthCloseButton,
  AuthCloseFallback,
} from '@/components/auth/auth-close-button'
import UNLVMountainClub from '@/components/unlv-mountain-club'
import { CLUB_EMAIL } from '@/lib/constants'

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-2">
      <section
        className="relative hidden min-h-svh overflow-hidden bg-[var(--editorial-inverse)] text-[#F8F1DF] lg:block"
        aria-label="Mountain Club community"
      >
        <Image
          src="/welcome/sunset-group.jpg"
          alt="Mountain Club members together beneath a desert sunset"
          fill
          sizes="(min-width: 1024px) 50vw, 1px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/20" />
        <div className="relative flex h-full min-h-svh flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            aria-label="Mountain Club home"
            className="block w-56 max-w-full outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <UNLVMountainClub
              idPrefix="auth-desktop-brand"
              viewBox="0 0 355 196"
              className="h-auto w-full"
              aria-hidden="true"
              focusable="false"
            />
          </Link>
          <div className="max-w-lg">
            <p className="mb-5 text-sm uppercase tracking-widest text-[#FFECA2]">
              Good people. Great outdoors.
            </p>
            <p className="font-brand text-6xl uppercase leading-[0.95] xl:text-7xl">
              Your next adventure
              <br />
              starts with us.
            </p>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/80">
              Find your people, get outside, and make a few stories worth
              telling.
            </p>
          </div>
        </div>
      </section>
      <div className="flex min-w-0 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
        <nav
          className="flex items-center justify-between gap-3 lg:justify-end"
          aria-label="Authentication navigation"
        >
          <Link
            href="/"
            aria-label="Mountain Club home"
            className="block w-40 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <UNLVMountainClub
              idPrefix="auth-mobile-brand"
              viewBox="0 0 355 196"
              className="h-auto w-full"
              aria-hidden="true"
              focusable="false"
            />
          </Link>
          <Suspense fallback={<AuthCloseFallback />}>
            <AuthCloseButton />
          </Suspense>
        </nav>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-12">
          <header className="mb-7">
            <h1 className="font-brand text-5xl uppercase leading-none sm:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-6 text-muted-foreground">
              {description}
            </p>
          </header>
          {children}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Need a hand?{' '}
          <a
            href={`mailto:${CLUB_EMAIL}`}
            className="inline-flex min-h-11 items-center font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Contact the club
          </a>
        </p>
      </div>
    </main>
  )
}
