'use client'

import type { Provider } from '@supabase/supabase-js'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOAuthLinkErrorMessage } from '@/lib/auth/oauth-link'
import { CLUB_EMAIL } from '@/lib/constants'
import { upsertProfile } from '@/lib/profile/queries'
import type { ProfileRow, ProfileUpdate } from '@/lib/profile/types'
import { createClient } from '@/lib/supabase/client'

type AccountSettingsFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
  email: string | null
  isAdmin: boolean
}

type AccountFormState = {
  avatarUrl: string
  displayName: string
  firstName: string
  lastName: string
  phone: string
}

export function AccountSettingsFormClient({
  initialProfile,
  userId,
  email,
  isAdmin,
}: AccountSettingsFormClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()
  const initialValues = useMemo<AccountFormState>(
    () => ({
      avatarUrl: initialProfile?.avatar_url ?? '',
      displayName: initialProfile?.display_name ?? '',
      firstName: initialProfile?.first_name ?? '',
      lastName: initialProfile?.last_name ?? '',
      phone: initialProfile?.phone ?? '',
    }),
    [initialProfile],
  )

  const [values, setValues] = useState<AccountFormState>(initialValues)
  const [baseline, setBaseline] = useState<AccountFormState>(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [passwordValues, setPasswordValues] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(
    new Set(),
  )
  const [connectMessage, setConnectMessage] = useState<string | null>(null)
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(
    null,
  )
  const [mergePrimaryUserId, setMergePrimaryUserId] = useState('')
  const [mergeSecondaryUserId, setMergeSecondaryUserId] = useState('')
  const [mergeMessage, setMergeMessage] = useState<string | null>(null)
  const [mergeReport, setMergeReport] = useState<Record<string, number> | null>(
    null,
  )
  const [isMergeLoading, setIsMergeLoading] = useState(false)
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    setValues(initialValues)
    setBaseline(initialValues)
  }, [initialValues])

  const isDirty =
    values.avatarUrl !== baseline.avatarUrl ||
    values.displayName !== baseline.displayName ||
    values.firstName !== baseline.firstName ||
    values.lastName !== baseline.lastName ||
    values.phone !== baseline.phone

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  useEffect(() => {
    let active = true
    const loadIdentities = () =>
      supabase.auth
        .getUserIdentities()
        .then(({ data, error }) => {
          if (!active) return
          if (error) {
            setConnectMessage(
              error.message || 'Unable to load connected providers right now.',
            )
            return
          }

          const providers = new Set(
            (data.identities ?? [])
              .map(identity => identity.provider)
              .filter((provider): provider is string => !!provider),
          )
          setConnectedProviders(providers)
        })
        .catch(error => {
          if (!active) return
          setConnectMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load connected providers right now.',
          )
        })

    loadIdentities()

    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    const oauthLinked = searchParams.get('oauthLinked')
    if (oauthLinked === '1') {
      const provider = searchParams.get('provider')
      const providerLabel =
        provider && provider.length > 0
          ? `${provider[0]?.toUpperCase() ?? ''}${provider.slice(1)}`
          : 'Provider'
      setConnectMessage(`${providerLabel} connected successfully.`)
      setConnectingProvider(null)
      return
    }

    const oauthLinkError = searchParams.get('oauthLinkError')
    if (oauthLinkError === '1') {
      setConnectMessage(
        'We could not complete provider linking. Try again or sign in with the other account and contact an admin for merge support.',
      )
      setConnectingProvider(null)
    }
  }, [searchParams])

  const handleFieldChange = (key: keyof AccountFormState, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const displayName = values.displayName.trim() || 'Member'
      const payload: ProfileUpdate = {
        avatar_url: values.avatarUrl.trim() || null,
        display_name: displayName,
        first_name: values.firstName.trim() || null,
        last_name: values.lastName.trim() || null,
        phone: values.phone.trim() || null,
        updated_at: new Date().toISOString(),
      }
      await upsertProfile(supabase, userId, payload)
      setBaseline(values)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save changes',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setValues(baseline)
    setSaveError(null)
  }

  const passwordStrength = useMemo(() => {
    const score =
      Number(passwordValues.next.length >= 10) +
      Number(/[A-Z]/.test(passwordValues.next)) +
      Number(/[0-9]/.test(passwordValues.next)) +
      Number(/[^A-Za-z0-9]/.test(passwordValues.next))
    if (!passwordValues.next) return 'Add a new password to see strength'
    if (score <= 1) return 'Weak — add length or numbers'
    if (score <= 2) return 'Fair — add a symbol or uppercase'
    if (score <= 3) return 'Good — almost there'
    return 'Strong password'
  }, [passwordValues.next])

  const handlePasswordChange = async () => {
    setPasswordMessage(null)
    if (!email) {
      setPasswordMessage('No email address found for your account.')
      return
    }
    if (
      !passwordValues.current ||
      !passwordValues.next ||
      !passwordValues.confirm
    ) {
      setPasswordMessage('Complete all password fields to continue.')
      return
    }
    if (passwordValues.next !== passwordValues.confirm) {
      setPasswordMessage('New passwords do not match.')
      return
    }
    if (passwordValues.next.length < 10) {
      setPasswordMessage('Choose a password that is at least 10 characters.')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordValues.next,
      })
      if (error) throw error
      setPasswordValues({ current: '', next: '', confirm: '' })
      setPasswordMessage(
        'Password updated. Use your new password next time you sign in.',
      )
    } catch (error) {
      setPasswordMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update password. Try again later.',
      )
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    if (deleteConfirm.trim() !== 'DELETE') {
      setDeleteError('Type DELETE to confirm account removal.')
      return
    }
    setDeleteError(
      'Account deletion is not enabled yet. Contact support to proceed.',
    )
  }

  const handleConnectOAuth = async (provider: Provider) => {
    setConnectMessage(null)
    setConnectingProvider(provider)
    try {
      const nextPath = '/profile/user/account'
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', nextPath)
      callbackUrl.searchParams.set('provider', provider)

      const credentials = {
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            flow: 'link',
          },
        },
      } as const

      const { error } = await supabase.auth.linkIdentity(credentials)
      if (error) {
        throw error
      }
    } catch (error) {
      setConnectMessage(getOAuthLinkErrorMessage(error))
      setConnectingProvider(null)
    }
  }

  const handleMergeAccounts = async (dryRun: boolean) => {
    setMergeMessage(null)
    setMergeReport(null)

    const primaryUserId = mergePrimaryUserId.trim()
    const secondaryUserId = mergeSecondaryUserId.trim()

    if (!primaryUserId || !secondaryUserId) {
      setMergeMessage('Enter both primary and secondary user IDs.')
      return
    }

    if (primaryUserId === secondaryUserId) {
      setMergeMessage('Primary and secondary user IDs must be different.')
      return
    }

    setIsMergeLoading(true)
    try {
      const response = await fetch('/api/admin/account-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryUserId, secondaryUserId, dryRun }),
      })

      const payload = (await response.json()) as {
        error?: string
        audit?: { counts?: Record<string, number> }
        applied?: boolean
      }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Account merge request failed.')
      }

      setMergeReport(payload.audit?.counts ?? null)
      setMergeMessage(
        dryRun
          ? 'Dry run complete. Review affected row counts below.'
          : payload.applied
            ? 'Merge complete. Secondary account was soft-deleted.'
            : 'Merge request completed.',
      )
    } catch (error) {
      setMergeMessage(
        error instanceof Error ? error.message : 'Unable to process merge.',
      )
    } finally {
      setIsMergeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Accordion
        type="multiple"
        defaultValue={['account-details']}
        className="space-y-3"
      >
        <AccordionItem
          value="account-details"
          className="rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm"
        >
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Account details</p>
              <p className="text-sm text-muted-foreground">
                Update the basics for how your profile appears to the club.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-[auto,1fr] md:items-center">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={values.avatarUrl || undefined}
                    alt={values.displayName || 'Profile avatar'}
                  />
                  <AvatarFallback>
                    {(values.displayName || 'M').trim().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-2">
                  <Label htmlFor="avatar-url">Avatar URL</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="avatar-url"
                      value={values.avatarUrl}
                      onChange={event =>
                        handleFieldChange('avatarUrl', event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleFieldChange('avatarUrl', '')}
                    >
                      Remove avatar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    value={values.displayName}
                    onChange={event =>
                      handleFieldChange('displayName', event.target.value)
                    }
                    placeholder="Your public name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={values.phone}
                    onChange={event =>
                      handleFieldChange('phone', event.target.value)
                    }
                    placeholder="(702) 555-1234"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={values.firstName}
                    onChange={event =>
                      handleFieldChange('firstName', event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={values.lastName}
                    onChange={event =>
                      handleFieldChange('lastName', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nshe-id">NSHE ID</Label>
                  <Input
                    id="nshe-id"
                    placeholder="Not available yet"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    We will add NSHE verification for club administration soon.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="school-email">UNLV school email</Label>
                  <Input id="school-email" placeholder="Coming soon" disabled />
                  <p className="text-xs text-muted-foreground">
                    Add your UNLV email once the school sync is connected.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="auth-email">Account email</Label>
                  <Input
                    id="auth-email"
                    value={email ?? ''}
                    disabled
                    placeholder="Not set"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="opacity-0">Change email</Label>
                  <Button asChild variant="outline" className="justify-center">
                    <Link href={`mailto:${CLUB_EMAIL}`}>
                      Request email change
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Email changes are handled by club admins for now.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="connected-accounts"
          className="rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm"
        >
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Connected accounts</p>
              <p className="text-sm text-muted-foreground">
                Link Google or Discord so you can sign in with either provider.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    connectingProvider !== null ||
                    connectedProviders.has('google')
                  }
                  onClick={() => handleConnectOAuth('google')}
                >
                  {connectedProviders.has('google')
                    ? 'Google connected'
                    : connectingProvider === 'google'
                      ? 'Connecting Google...'
                      : 'Connect Google'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    connectingProvider !== null ||
                    connectedProviders.has('discord')
                  }
                  onClick={() => handleConnectOAuth('discord')}
                >
                  {connectedProviders.has('discord')
                    ? 'Discord connected'
                    : connectingProvider === 'discord'
                      ? 'Connecting Discord...'
                      : 'Connect Discord'}
                </Button>
              </div>
              {connectMessage ? (
                <p className="text-xs text-muted-foreground">
                  {connectMessage}
                </p>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>

        {isAdmin ? (
          <AccordionItem
            value="account-merge"
            className="rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline">
              <div className="space-y-1">
                <p className="text-lg font-semibold">Account merge (admin)</p>
                <p className="text-sm text-muted-foreground">
                  Merge duplicate auth users into one primary account.
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="merge-primary-user-id">
                      Primary user ID
                    </Label>
                    <Input
                      id="merge-primary-user-id"
                      value={mergePrimaryUserId}
                      onChange={event =>
                        setMergePrimaryUserId(event.target.value)
                      }
                      placeholder={userId}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="merge-secondary-user-id">
                      Secondary user ID
                    </Label>
                    <Input
                      id="merge-secondary-user-id"
                      value={mergeSecondaryUserId}
                      onChange={event =>
                        setMergeSecondaryUserId(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isMergeLoading}
                    onClick={() => handleMergeAccounts(true)}
                  >
                    {isMergeLoading ? 'Running dry run...' : 'Run dry run'}
                  </Button>
                  <Button
                    type="button"
                    disabled={isMergeLoading}
                    onClick={() => handleMergeAccounts(false)}
                  >
                    {isMergeLoading ? 'Merging...' : 'Merge accounts'}
                  </Button>
                </div>

                {mergeMessage ? (
                  <p className="text-xs text-muted-foreground">
                    {mergeMessage}
                  </p>
                ) : null}

                {mergeReport ? (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Merge impact counts
                    </p>
                    <div className="grid gap-1 text-xs">
                      {Object.entries(mergeReport).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-medium">{key}</span>: {value}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem
          value="change-password"
          className="rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm"
        >
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Change password</p>
              <p className="text-sm text-muted-foreground">
                Use a strong password to secure your account.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordValues.current}
                    onChange={event =>
                      setPasswordValues(prev => ({
                        ...prev,
                        current: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordValues.next}
                    onChange={event =>
                      setPasswordValues(prev => ({
                        ...prev,
                        next: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordValues.confirm}
                    onChange={event =>
                      setPasswordValues(prev => ({
                        ...prev,
                        confirm: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {passwordStrength}
                </p>
                <Button variant="outline" onClick={handlePasswordChange}>
                  Update password
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                If you run into issues, you can also{' '}
                <Link
                  className="underline underline-offset-4"
                  href="/auth/forgot-password"
                >
                  send a reset email
                </Link>
                .
              </div>
              {passwordMessage ? (
                <p className="text-xs text-muted-foreground">
                  {passwordMessage}
                </p>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="account-removal"
          className="rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm"
        >
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Account removal</p>
              <p className="text-sm text-muted-foreground">
                Deleting your account is permanent and cannot be undone.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Remove your profile and membership history from the club roster.
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes your profile, memberships, and saved
                      preferences. Type DELETE to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="mt-4 grid gap-2">
                    <Label htmlFor="delete-confirm">Type DELETE</Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirm}
                      onChange={event => setDeleteConfirm(event.target.value)}
                      placeholder="DELETE"
                    />
                    {deleteError ? (
                      <p className="text-xs text-destructive">{deleteError}</p>
                    ) : null}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      Confirm delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}
