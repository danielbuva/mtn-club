'use client'

import Link from 'next/link'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { Switch } from '@/components/ui/switch'
import {
  type EmailPreferences,
  emailCategories,
} from '@/lib/profile/email-preferences'

export function EmailPreferencesFields({
  value,
  onChange,
  disabled,
}: {
  value: EmailPreferences
  onChange: (value: EmailPreferences) => void
  disabled: boolean
}) {
  return (
    <SettingsCard
      title="Email preferences"
      description="Choose which emails you receive. Your existing choices are preserved."
    >
      <div className="space-y-4">
        {emailCategories.map(category => (
          <div
            className="flex items-center justify-between gap-4"
            key={category.key}
          >
            <div>
              <p className="text-sm font-medium">{category.label}</p>
              <p
                className="text-xs text-muted-foreground"
                id={`email-${category.key}-description`}
              >
                {category.description}
              </p>
            </div>
            <Switch
              aria-label={category.label}
              aria-describedby={`email-${category.key}-description`}
              checked={value[category.key]}
              disabled={
                disabled ||
                (category.key !== 'email' && !value.email) ||
                (['tripReminders', 'safetyAlerts'].includes(category.key) &&
                  !value.tripUpdates)
              }
              onCheckedChange={checked =>
                onChange({ ...value, [category.key]: checked })
              }
            />
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Trip updates and seat offers remain in{' '}
          <Link className="underline" href="/profile/trips">
            My trips
          </Link>{' '}
          even when email is off. Turning off trip emails can mean missing a
          time-limited seat offer. These choices do not change who can see your
          contact details.
        </p>
      </div>
    </SettingsCard>
  )
}
