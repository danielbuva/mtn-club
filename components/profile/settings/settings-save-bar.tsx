'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SettingsSaveBarProps = {
  isDirty: boolean
  isSaving?: boolean
  saveError?: string | null
  onSave: () => void
  onReset: () => void
}

export function SettingsSaveBar({
  isDirty,
  isSaving = false,
  saveError,
  onSave,
  onReset,
}: SettingsSaveBarProps) {
  if (!isDirty) return null

  return (
    <div className="sticky bottom-6 z-20">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="text-sm">
          <p className="font-medium text-foreground">
            You have unsaved changes
          </p>
          {saveError ? (
            <p className="text-xs text-destructive">{saveError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save to keep your updates.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={isSaving} onClick={onReset}>
            Discard
          </Button>
          <Button disabled={isSaving} onClick={onSave}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
