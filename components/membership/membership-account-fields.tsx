'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const inputClass =
  'h-12 rounded-none border-[#211D18]/35 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]'

export function MembershipAccountFields({
  defaultEmail,
}: {
  defaultEmail: string
}) {
  const [showPasswords, setShowPasswords] = useState(false)
  const passwordType = showPasswords ? 'text' : 'password'

  return (
    <fieldset className="grid gap-5 border-t border-[#211D18]/20 pt-7">
      <legend className="font-brand text-3xl uppercase">Your account</legend>
      <p className="max-w-2xl text-sm leading-6 text-[#211D18]/65">
        This email becomes your Mountain Club login and your contact email for
        the application.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={defaultEmail}
            className={inputClass}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type={passwordType}
            autoComplete="new-password"
            aria-describedby="password-requirements"
            minLength={8}
            className={inputClass}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeatPassword">Repeat password</Label>
          <Input
            id="repeatPassword"
            name="repeatPassword"
            type={passwordType}
            autoComplete="new-password"
            aria-describedby="password-requirements"
            minLength={8}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p id="password-requirements" className="text-sm text-[#211D18]/65">
          Use at least 8 characters.
        </p>
        <button
          type="button"
          aria-pressed={showPasswords}
          onClick={() => setShowPasswords(current => !current)}
          className="inline-flex min-h-10 items-center gap-2 px-1 text-sm font-semibold underline decoration-[#211D18]/35 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#211D18]"
        >
          {showPasswords ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </button>
      </div>
    </fieldset>
  )
}
