import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Your account is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Continue to Mountain Club to explore upcoming trips and finish
                setting up your profile.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-10 items-center bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Continue
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
