import { Suspense } from 'react'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function UpdatePasswordFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>Loading secure password reset form...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <div className="h-4 w-28 rounded bg-muted/70 animate-pulse" />
            <div className="h-10 rounded-md bg-muted/70 animate-pulse" />
          </div>
          <Button className="w-full" disabled>
            Loading...
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<UpdatePasswordFallback />}>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
