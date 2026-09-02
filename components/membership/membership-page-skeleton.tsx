import { PublicShell } from '@/components/landing/public-shell'

export function MembershipPageSkeleton() {
  return (
    <PublicShell>
      <section
        className="public-page-top border-b border-[#211D18]/15 px-5 pb-14 sm:px-8 sm:pb-20"
        aria-busy="true"
        aria-label="Loading membership account"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <div className="h-4 w-28 animate-pulse bg-[#211D18]/10" />
            <div className="mt-3 h-14 max-w-xl animate-pulse bg-[#211D18]/10 sm:h-20" />
            <div className="mt-6 h-8 max-w-2xl animate-pulse bg-[#E9DDC3]" />
          </div>
          <div className="min-h-48 animate-pulse bg-[#211D18]" />
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <div className="h-48 animate-pulse bg-white/55" />
            <div className="h-64 animate-pulse border border-[#211D18]/20" />
          </div>
          <div className="h-80 animate-pulse bg-[#E9DDC3]" />
        </div>
      </section>
    </PublicShell>
  )
}
