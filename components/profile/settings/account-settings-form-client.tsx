'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertProfile } from '@/lib/profile/queries'
import type { ProfileRow, ProfileUpdate } from '@/lib/profile/types'
import { createClient } from '@/lib/supabase/client'

type AccountSettingsFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
  email: string | null
}

type AccountFormState = {
  displayName: string
  firstName: string
  lastName: string
  phone: string
}

export function AccountSettingsFormClient({
  initialProfile,
  userId,
  email,
}: AccountSettingsFormClientProps) {
  const initialValues = useMemo<AccountFormState>(
    () => ({
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
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    setValues(initialValues)
    setBaseline(initialValues)
  }, [initialValues])

  const isDirty =
    values.displayName !== baseline.displayName ||
    values.firstName !== baseline.firstName ||
    values.lastName !== baseline.lastName ||
    values.phone !== baseline.phone

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const handleFieldChange = (key: keyof AccountFormState, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        display_name: values.displayName.trim() || null,
        first_name: values.firstName.trim() || null,
        last_name: values.lastName.trim() || null,
        phone: values.phone.trim() || null,
        updated_at: new Date().toISOString(),
      }
      const supabase = createClient()
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
      const supabase = createClient()
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

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Account details"
        description="Update the basics for how your profile appears to the club."
      >
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
              onChange={event => handleFieldChange('phone', event.target.value)}
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
            <Input id="nshe-id" placeholder="Not available yet" disabled />
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
              <Link href="mailto:hello@mountainclub.com">
                Request email change
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Email changes are handled by club admins for now.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Change password"
        description="Use a strong password to secure your account."
        footer={
          passwordMessage ? (
            <p className="text-xs text-muted-foreground">{passwordMessage}</p>
          ) : null
        }
      >
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
          <p className="text-xs text-muted-foreground">{passwordStrength}</p>
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
      </SettingsCard>

      <SettingsCard
        title="Account removal"
        description="Deleting your account is permanent and cannot be undone."
      >
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
                  This removes your profile, memberships, and saved preferences.
                  Type DELETE to confirm.
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
      </SettingsCard>

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
