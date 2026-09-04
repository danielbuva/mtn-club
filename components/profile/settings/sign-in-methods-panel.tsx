'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { connectSignInMethod } from '@/app/auth/link-actions'
import { FormMessage } from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { authHref } from '@/lib/auth/return-to'
import {
  type OAuthProvider,
  oauthProviders,
  providerLabel,
} from '@/lib/auth/sign-in-methods'
import { CLUB_EMAIL } from '@/lib/constants'

export function SignInMethodsPanel({
  providers,
  email,
}: {
  providers: OAuthProvider[]
  email: string | null
}) {
  const [pending, setPending] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  async function connect(provider: OAuthProvider) {
    if (busy.current) return
    busy.current = true
    setPending(provider)
    setError(null)
    try {
      const result = await connectSignInMethod(provider)
      if (result.error) setError(result.error)
      else if (result.url) {
        window.location.assign(result.url)
        return
      }
    } catch {
      setError(
        'We could not open the provider. Check your connection and try again.',
      )
    }
    busy.current = false
    setPending(null)
  }
  return (
    <section
      id="sign-in-methods"
      aria-labelledby="sign-in-methods-heading"
      aria-busy={pending !== null}
      className="scroll-mt-24 space-y-5 rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6"
    >
      <div className="space-y-2">
        <h2 id="sign-in-methods-heading" className="text-lg font-semibold">
          One account. Your choice of sign-in.
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Connected methods all open this profile, membership, and event
          history. Only connect accounts you own.
        </p>
      </div>
      {error && (
        <FormMessage>
          {error}{' '}
          <a className="underline" href={`mailto:${CLUB_EMAIL}`}>
            Contact club support
          </a>
        </FormMessage>
      )}
      <ul className="divide-y rounded-lg border">
        {oauthProviders.map(provider => {
          const connected = providers.includes(provider)
          return (
            <li
              key={provider}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{providerLabel[provider]}</p>
                <p className="text-sm text-muted-foreground">
                  {connected ? 'Connected to this account' : 'Not connected'}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-12"
                disabled={pending !== null || connected}
                onClick={() => connect(provider)}
              >
                {connected
                  ? 'Connected'
                  : pending === provider
                    ? 'Opening…'
                    : `Connect ${providerLabel[provider]}`}
              </Button>
            </li>
          )
        })}
      </ul>
      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">Email &amp; password</h3>
        <p className="break-words text-sm leading-6 text-muted-foreground">
          {email
            ? `Use ${email} with a password. Joined with Google or Discord? The email-reset journey also lets you set your first password.`
            : 'Contact club support to add an account email before setting a password.'}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          We’ll send a secure link so you can prove you own the inbox. Choose at
          least 12 characters; a memorable phrase works well.
        </p>
        {email &&
          (pending ? (
            <Button disabled variant="outline" className="min-h-12">
              Set or reset password
            </Button>
          ) : (
            <Button asChild variant="outline" className="min-h-12">
              <Link
                href={authHref(
                  '/auth/forgot-password',
                  '/profile/user/account#sign-in-methods',
                )}
              >
                Set or reset password
              </Link>
            </Button>
          ))}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        If a provider belongs to a different club account, we won’t merge
        accounts here.{' '}
        <a
          href={`mailto:${CLUB_EMAIL}`}
          className="underline underline-offset-4"
        >
          Contact club support
        </a>{' '}
        to verify ownership and review both accounts.
      </p>
    </section>
  )
}
