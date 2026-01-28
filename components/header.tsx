'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BadgeCheck,
  Calendar,
  LogOut,
  Menu,
  Moon,
  Mountain,
  Sun,
  Monitor,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useViewer } from '@/components/auth/viewer-provider'
import { MemberCTA } from '@/components/member-cta'
import { signOutAction } from '@/app/actions/auth'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/team', label: 'Team' },
  { href: '/about', label: 'About' },
]

const getInitials = (value: string | null | undefined) => {
  if (!value) return 'MC'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]).join('')
  return initials.toUpperCase() || 'MC'
}

export function Header() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const viewer = useViewer()
  const signOutFormId = 'header-signout-form'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const profileName = viewer.member?.fullName ?? viewer.email ?? 'Member'
  const profileInitials = getInitials(profileName)
  const currentTheme = theme ?? 'system'
  const membershipState = viewer.membershipState
  const membershipBanned =
    membershipState === 'banned' || !!viewer.membershipBannedAt
  const membershipSuspended = membershipState === 'suspended'
  const shouldShowRenewCta =
    viewer.isAuthenticated &&
    !viewer.isMember &&
    !!membershipState &&
    !membershipBanned &&
    !membershipSuspended &&
    ['inactive', 'past_due', 'canceled'].includes(membershipState ?? '')

  const themePillButtonClass = (value: 'light' | 'system' | 'dark') =>
    cn(
      'inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-sm transition-colors',
      currentTheme === value
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )

  const authRedirect = encodeURIComponent(
    `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  )

  const handleSignOut = () => {
    const form = document.getElementById(signOutFormId) as HTMLFormElement | null
    form?.requestSubmit()
  }

  const cycleTheme = () => {
    const nextTheme =
      currentTheme === 'system' ? 'light' : currentTheme === 'light' ? 'dark' : 'system'
    setTheme(nextTheme)
  }

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  const ThemeTogglePill = ({ className }: { className?: string }) => (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center rounded-full border border-border/60 bg-secondary/40 p-1',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={currentTheme === 'light'}
        onClick={() => setTheme('light')}
        className={themePillButtonClass('light')}
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light theme</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={currentTheme === 'system'}
        onClick={() => setTheme('system')}
        className={themePillButtonClass('system')}
      >
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System theme</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={currentTheme === 'dark'}
        onClick={() => setTheme('dark')}
        className={themePillButtonClass('dark')}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark theme</span>
      </button>
    </div>
  )

  const ThemeCycleIcon = ({ className }: { className?: string }) => {
    if (currentTheme === 'light') {
      return <Sun className={className} />
    }
    if (currentTheme === 'dark') {
      return <Moon className={className} />
    }
    return <Monitor className={className} />
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <form id={signOutFormId} action={signOutAction} className="sr-only" />
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Mountain className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">UNLV Mountain Club</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {viewer.isMember ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={viewer.member?.avatarUrl ?? undefined} alt={profileName} />
                      <AvatarFallback>{profileInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{profileName}</span>
                    {viewer.email && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {viewer.email}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/membership">
                      <BadgeCheck className="h-4 w-4" />
                      Membership
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calendar">
                      <Calendar className="h-4 w-4" />
                      Trips
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Theme</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={cycleTheme}
                        className="rounded-lg"
                        aria-label="Cycle theme"
                      >
                        <ThemeCycleIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      handleSignOut()
                    }}
                    className="flex w-full items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleTheme}
                  className="hidden md:inline-flex rounded-lg"
                  aria-label="Cycle theme"
                >
                  <ThemeCycleIcon className="h-5 w-5" />
                </Button>
                {!viewer.isAuthenticated && (
                  <Button variant="ghost" className="rounded-xl font-medium" asChild>
                    <Link href={`/auth/login?redirect=${authRedirect}`}>Sign in</Link>
                  </Button>
                )}
                <div className="hidden sm:block">
                  <MemberCTA
                    className="rounded-xl font-medium"
                    {...(shouldShowRenewCta ? { children: 'Renew Membership' } : {})}
                  />
                </div>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader className="sr-only">
                  <SheetTitle>Mobile navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-8 h-full">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleMobileNavClick}
                      className={cn(
                        'px-4 py-3 rounded-none text-base font-medium transition-colors',
                        pathname === link.href
                          ? 'text-foreground bg-secondary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!viewer.isAuthenticated && (
                    <Link
                      href={`/auth/login?redirect=${authRedirect}`}
                      onClick={handleMobileNavClick}
                      className={cn(
                        'px-4 py-3 rounded-none text-base font-medium transition-colors',
                        pathname === '/auth/login'
                          ? 'text-foreground bg-secondary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      )}
                    >
                      Sign in
                    </Link>
                  )}
                  {viewer.isMember && (
                    <Link
                      href="/profile"
                      onClick={handleMobileNavClick}
                      className={cn(
                        'px-4 py-3 rounded-none text-base font-medium transition-colors',
                        pathname === '/profile'
                          ? 'text-foreground bg-secondary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      )}
                    >
                      Profile
                    </Link>
                  )}
                  <div className="mt-4 empty:hidden">
                    <div onClick={handleMobileNavClick}>
                      <MemberCTA
                        className="w-full rounded-none font-medium"
                        {...(shouldShowRenewCta ? { children: 'Renew Membership' } : {})}
                      />
                    </div>
                  </div>
                  <div className="mt-auto pb-6 ml-4">
                    <ThemeTogglePill className="w-fit" />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
