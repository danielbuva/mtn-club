import { ClubBadge } from '@/components/brand/club-badge'

/** Badge plus "Leadership Admin" label for the admin sidebar and its fallback. */
export function AdminBrand() {
  return (
    <>
      <ClubBadge className="h-10 w-auto shrink-0" />
      <span className="border-l border-[#211D18]/20 pl-3 dark:border-border">
        <span className="block font-brand text-base font-bold uppercase leading-none tracking-wide">
          Leadership
        </span>
        <span className="mt-1 block font-brand text-[13px] font-bold uppercase leading-none tracking-[0.15em] text-[#6A5146] dark:text-muted-foreground">
          Admin
        </span>
      </span>
    </>
  )
}
