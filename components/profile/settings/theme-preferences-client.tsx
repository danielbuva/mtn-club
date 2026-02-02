'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeOption = 'system' | 'light' | 'dark'

export function ThemePreferencesClient() {
  const { theme, setTheme } = useTheme()
  const normalizedTheme = useMemo<ThemeOption>(
    () => (theme === 'light' || theme === 'dark' ? theme : 'system'),
    [theme],
  )
  const [selectedTheme, setSelectedTheme] =
    useState<ThemeOption>(normalizedTheme)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    setSelectedTheme(normalizedTheme)
  }, [normalizedTheme])

  const isDirty = selectedTheme !== normalizedTheme

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const handleSave = () => {
    setSaveError(null)
    setTheme(selectedTheme)
    setIsDirty(false)
  }

  const handleReset = () => {
    setSelectedTheme(normalizedTheme)
    setSaveError(null)
    setIsDirty(false)
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Theme"
        description="Choose how the app should look on this device."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(['system', 'light', 'dark'] as ThemeOption[]).map(option => (
            <Button
              key={option}
              type="button"
              variant="outline"
              className={cn(
                'justify-start capitalize',
                selectedTheme === option &&
                  'border-primary/60 bg-primary/10 text-primary',
              )}
              onClick={() => setSelectedTheme(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Accent color"
        description="Accent colors are coming soon. We'll use this to personalize your UI."
      >
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>Coming soon: pick a color to highlight buttons and cards.</p>
        </div>
      </SettingsCard>

      <SettingsSaveBar
        isDirty={isDirty}
        saveError={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}
