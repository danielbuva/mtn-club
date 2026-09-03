import { AlertTriangle, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function AdminAccessContent({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const needsSetup = reason === 'setup'

  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-lg border-[#211D18]/15 bg-white/70 dark:border-border dark:bg-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="font-brand text-3xl uppercase">
            {needsSetup ? 'Admin setup required' : 'Admin access required'}
          </CardTitle>
          <CardDescription className="leading-6">
            {needsSetup
              ? 'You are signed in, but the admin permission system is not available in this Supabase project yet. Ask a project owner to deploy the latest database migration, then try again.'
              : 'You are signed in, but this account does not currently have an administrative role. A super admin can grant access after confirming your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin">
              Try admin again <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" /> View public site
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

function AdminAccessFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 size-11 animate-pulse bg-muted" />
          <div className="h-9 w-64 animate-pulse bg-muted" />
          <div className="mt-2 h-12 animate-pulse bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-9 w-36 animate-pulse bg-muted" />
        </CardContent>
      </Card>
    </main>
  )
}

export default function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  return (
    <Suspense fallback={<AdminAccessFallback />}>
      <AdminAccessContent searchParams={searchParams} />
    </Suspense>
  )
}
