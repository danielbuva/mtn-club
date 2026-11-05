// Values shared by every Supabase Auth template (Go-template placeholders).
import { inlineLink } from './layout.ts'

export type AuthTemplate = { file: string; subject: string; html: string }

export const site = '{{ .SiteURL }}'
export const contact = inlineLink(
  'mailto:unlvmountainclub@gmail.com',
  'email the club',
)
export const accountReason =
  'You’re getting this because {{ .Email }} has an account with UNLV Mountain Club.'
export const resetHref = `${site}/auth/forgot-password?returnTo=%2Fprofile%2Fuser%2Faccount`
/** Links for flows Supabase starts without an app-provided redirect. */
export const confirmLink = (type: 'invite' | 'email_change') =>
  `${site}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;returnTo=%2Fprofile%2Fuser%2Faccount`
