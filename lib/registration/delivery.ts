import { z } from 'zod'

type Message = { subject: string; html: string; text: string }
type DeliveryResult = {
  providerId: string | null
  errorCode: string | null
  retry: boolean
}

export async function deliverRegistrationEmail(
  input: {
    jobId: string
    apiKey: string
    from: string
    to: string
    message: Message
  },
  send: typeof fetch = fetch,
): Promise<DeliveryResult> {
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `registration/${input.jobId}`,
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        ...input.message,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok)
      return {
        providerId: null,
        errorCode: `provider_${response.status}`,
        retry: response.status === 429 || response.status >= 500,
      }
    const parsed = z.object({ id: z.string() }).safeParse(await response.json())
    return parsed.success
      ? { providerId: parsed.data.id, errorCode: null, retry: false }
      : {
          providerId: null,
          errorCode: 'invalid_provider_response',
          retry: true,
        }
  } catch {
    return { providerId: null, errorCode: 'provider_unavailable', retry: true }
  }
}
