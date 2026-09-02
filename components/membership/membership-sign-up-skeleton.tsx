import { PublicShell } from '@/components/landing/public-shell'

export function MembershipSignUpSkeleton() {
  return (
    <PublicShell>
      <section
        className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24"
        aria-busy="true"
        aria-label="Loading membership"
      >
        <div className="mx-auto max-w-4xl">
          <div className="h-4 w-20 animate-pulse bg-[#211D18]/10" />
          <div className="mt-3 h-12 max-w-xl animate-pulse bg-[#211D18]/10 sm:h-16" />
          <div className="mt-5 h-6 w-64 animate-pulse bg-[#E9DDC3]" />

          <div className="mt-10 h-56 animate-pulse bg-[#211D18]" />

          <div className="mt-10 space-y-10 border-t border-[#211D18]/20 pt-7">
            <div className="h-28 animate-pulse bg-white/55" />
            <div className="h-52 animate-pulse border border-[#211D18]/20" />
            <div className="h-52 animate-pulse border border-[#211D18]/20" />
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
