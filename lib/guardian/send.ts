import 'server-only'
import { randomUUID } from 'node:crypto'
import { deliverRegistrationEmail } from '@/lib/registration/delivery'
import type { GuardianMessage } from './email'

export function siteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
}

/**
 * Sends a transactional guardian email right away (codes cannot wait for the
 * registration worker). In local development without email credentials, the
 * message is logged instead so the flow can be exercised end to end.
 */
export async function sendGuardianEmail(
  to: string,
  message: GuardianMessage,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.REGISTRATION_RESEND_API_KEY
  const from = process.env.REGISTRATION_EMAIL_FROM
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[guardian email → ${to}] ${message.subject}\n${message.text}`,
      )
      return { sent: true }
    }
    return { sent: false }
  }
  const result = await deliverRegistrationEmail({
    jobId: `guardian/${randomUUID()}`,
    apiKey,
    from,
    to,
    message,
  })
  return { sent: result.errorCode === null }
}
