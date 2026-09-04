import { AccountDetailLoading } from '@/components/admin/loading/forms'

export default function Loading() {
  return (
    <div aria-busy="true">
      <output className="sr-only">Loading account details…</output>
      <AccountDetailLoading />
    </div>
  )
}
