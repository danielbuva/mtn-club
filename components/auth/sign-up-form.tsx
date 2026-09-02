'use client'

import type { Provider } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOAuthLinkErrorMessage } from '@/lib/auth/oauth-link'
import {
  getReturnToFromSearchParams,
  getStoredReturnTo,
  storeReturnTo,
} from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthProviderLoading, setOauthProviderLoading] =
    useState<Provider | null>(null)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectQuery = redirectParam
    ? `?redirect=${encodeURIComponent(redirectParam)}`
    : ''

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data }) => setHasActiveSession(Boolean(data.user)))
      .catch(() => setHasActiveSession(false))
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const returnTo = getReturnToFromSearchParams(searchParams) ?? '/'
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      const destination = data.session
        ? returnTo
        : `/auth/login?redirect=${encodeURIComponent(returnTo)}`
      router.push(destination)
      setTimeout(() => {
        router.refresh()
      }, 0)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: Provider) => {
    const supabase = createClient()
    setError(null)
    setOauthProviderLoading(provider)

    try {
      const returnTo =
        getReturnToFromSearchParams(searchParams) ?? getStoredReturnTo() ?? '/'
      if (returnTo) {
        storeReturnTo(returnTo)
      }

      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', returnTo)
      callbackUrl.searchParams.set('provider', provider)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        throw userError
      }

      const credentials = {
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        },
      } as const

      const { error } = user
        ? await supabase.auth.linkIdentity({
            ...credentials,
            options: {
              ...credentials.options,
              queryParams: { flow: 'link' },
            },
          })
        : await supabase.auth.signInWithOAuth(credentials)

      if (error) throw error
    } catch (oauthError: unknown) {
      setError(getOAuthLinkErrorMessage(oauthError))
      setOauthProviderLoading(null)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading || oauthProviderLoading !== null}
                onClick={() => handleOAuthSignUp('google')}
              >
                {oauthProviderLoading === 'google'
                  ? 'Redirecting...'
                  : 'Continue with Google'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading || oauthProviderLoading !== null}
                onClick={() => handleOAuthSignUp('discord')}
              >
                {oauthProviderLoading === 'discord'
                  ? 'Redirecting...'
                  : 'Continue with Discord'}
              </Button>
              {hasActiveSession ? (
                <p className="text-xs text-muted-foreground">
                  You are signed in. OAuth will connect this provider to your
                  current account.
                </p>
              ) : null}
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link
                href={`/auth/login${redirectQuery}`}
                className="underline underline-offset-4"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
