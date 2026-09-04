import { redirect } from 'next/navigation'
import { CredentialsForm } from '@/components/auth/credentials-form'
import {
  type AuthSearchParams,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

export async function AuthEntry({
  mode,
  searchParams,
}: {
  mode: 'login' | 'signup'
  searchParams: Promise<AuthSearchParams>
}) {
  const [params, supabase] = await Promise.all([searchParams, createClient()])
  const returnTo =
    getReturnToFromSearchParams(readAuthSearchParams(params)) ?? '/'
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect(returnTo)
  return <CredentialsForm mode={mode} returnTo={returnTo} />
}
