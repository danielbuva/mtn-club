'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsNav } from '@/components/profile/settings/settings-nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function MobileSettingsNavSheet() {
  const [open, setOpen] = useState(false)
  const { confirmDiscard } = useSettingsDirty()

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (!next && !confirmDiscard()) return
        setOpen(next)
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="h-4 w-4" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader className="mb-6">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <SettingsNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
