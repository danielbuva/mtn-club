import { FormSkeleton } from '@/components/forms/form-skeleton'

export function NewTripLoading() {
  return (
    <main className="min-h-screen px-4 py-8">
      <FormSkeleton creation />
    </main>
  )
}
