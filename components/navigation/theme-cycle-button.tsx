'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const themeOrder = ['system', 'light', 'dark'] as const
type ThemeChoice = (typeof themeOrder)[number]

const themeLabels: Record<ThemeChoice, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

function isThemeChoice(value: string | undefined): value is ThemeChoice {
  return themeOrder.some(theme => theme === value)
}

function subscribeToHydration(): () => void {
  return () => undefined
}

function getClientHydrationSnapshot(): true {
  return true
}

function getServerHydrationSnapshot(): false {
  return false
}

export function ThemeCycleButton({
  className,
  onThemeChange,
  shape = 'round',
  showLabel = false,
  tabIndex,
}: {
  className?: string
  onThemeChange?: () => void
  shape?: 'round' | 'square'
  showLabel?: boolean
  tabIndex?: number
} = {}) {
  const { setTheme, theme } = useTheme()
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const currentTheme = hydrated && isThemeChoice(theme) ? theme : 'light'
  const currentIndex = themeOrder.indexOf(currentTheme)
  const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
  const Icon =
    currentTheme === 'system' ? Monitor : currentTheme === 'dark' ? Moon : Sun

  return (
    <button
      type="button"
      aria-hidden={!hydrated}
      aria-label={`Theme: ${themeLabels[currentTheme]}. Change to ${themeLabels[nextTheme]}.`}
      title={`${themeLabels[currentTheme]} theme`}
      onClick={() => {
        setTheme(nextTheme)
        onThemeChange?.()
      }}
      tabIndex={tabIndex}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center bg-secondary text-secondary-foreground outline-none transition hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        shape === 'round' && 'rounded-full',
        showLabel && 'flex-col gap-1 text-[9px] font-semibold leading-none',
        !hydrated && 'invisible',
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden="true" />
      {showLabel ? <span>Theme</span> : null}
    </button>
  )
}
