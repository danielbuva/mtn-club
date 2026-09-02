import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function TripNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-10">
      <Card className="w-full border-border/70">
        <CardContent className="space-y-4 p-6 text-center md:p-8">
          <h1 className="text-2xl font-semibold">Trip not found</h1>
          <p className="text-sm text-muted-foreground">
            This trip may have been removed or is no longer visible.
          </p>
          <Button asChild>
            <Link href="/trips">Back to trips</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
