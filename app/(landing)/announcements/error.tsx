'use client'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <h2 className="font-brand text-3xl uppercase">
        The noticeboard is unavailable
      </h2>
      <p className="my-5">
        We could not load the announcements. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
