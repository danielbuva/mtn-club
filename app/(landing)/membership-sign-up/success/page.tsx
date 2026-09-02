import Link from 'next/link'
import { PublicShell } from '@/components/landing/public-shell'

export default function Page() {
  return (
    <PublicShell>
      <section className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
            Application saved
          </p>
          <h1 className="mt-3 font-brand text-5xl uppercase leading-[0.9] sm:text-7xl">
            You&apos;re signed up.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#211D18]/70">
            Your membership application is ready for leadership review. You can
            check its status from the membership page.
          </p>
          <Link
            href="/membership"
            className="mt-8 inline-flex min-h-12 items-center bg-[#211D18] px-6 font-semibold text-[#FFECA2]"
          >
            View membership status
          </Link>
        </div>
      </section>
    </PublicShell>
  )
}
