'use client'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { consumeAuthArrival } from '@/app/auth/notice-actions'
import { takeAuthNotice } from '@/lib/auth/notices'
import { providerLabel } from '@/lib/auth/sign-in-methods'

export function AuthNotices() {
  const consumed = useRef(false)
  useEffect(() => {
    if (consumed.current) return
    consumed.current = true
    consumeAuthArrival(takeAuthNotice())
      .then(arrival => {
        if (!arrival) return
        if (arrival.notice === 'cancelled' || arrival.notice === 'failed') {
          toast(
            arrival.notice === 'cancelled'
              ? 'Connection cancelled.'
              : 'Connection not completed.',
            {
              description:
                'Your existing sign-in methods still work. Review them in Account settings before trying again.',
              closeButton: true,
            },
          )
          return
        }
        const title =
          arrival.notice === 'linked' && arrival.provider
            ? `${providerLabel[arrival.provider]} is connected.`
            : arrival.notice === 'created'
              ? 'Your account is ready.'
              : arrival.notice === 'password-updated'
                ? 'Password saved. You’re signed in.'
                : 'Welcome back. You’re signed in.'
        toast.success(title, {
          description:
            arrival.notice === 'linked'
              ? 'Use this sign-in method for the same profile and membership. Nothing has been duplicated.'
              : arrival.canAddMethod
                ? 'Make next time easier: add another way to sign in to this same account. You can do this anytime in settings.'
                : 'Your connected sign-in methods all open this same club account.',
          duration: 10000,
          closeButton: true,
          action: {
            label: arrival.canAddMethod
              ? 'Sign-in options'
              : 'Account settings',
            onClick: () =>
              window.location.assign('/profile/user/account#sign-in-methods'),
          },
        })
      })
      .catch(() => {
        // A failed informational notice must never interrupt the intended page.
      })
  }, [])
  return null
}
