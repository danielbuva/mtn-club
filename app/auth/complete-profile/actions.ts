'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sanitizeReturnTo } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

export type ProfileNameState = {
  error: string | null
  fieldErrors?: { firstName?: string; lastName?: string }
}

const nameSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Enter your first name.')
    .max(100, 'Use 100 characters or fewer.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Enter your last name.')
    .max(100, 'Use 100 characters or fewer.'),
})

export async function saveProfileNameAction(
  _previous: ProfileNameState,
  formData: FormData,
): Promise<ProfileNameState> {
  const parsed = nameSchema.safeParse({
    firstName: formData.get('firstName') ?? '',
    lastName: formData.get('lastName') ?? '',
  })
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      error: null,
      fieldErrors: {
        firstName: errors.firstName?.[0],
        lastName: errors.lastName?.[0],
      },
    }
  }
  const returnTo =
    sanitizeReturnTo(String(formData.get('returnTo') ?? '/')) ?? '/'
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)

  const { firstName, lastName } = parsed.data
  const { data: existing, error: readError } = await db
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()
  if (readError)
    return {
      error: 'We couldn’t save your name. Check your connection and try again.',
    }

  const fullName = `${firstName} ${lastName}`
  const result = existing
    ? await db
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          ...(existing.display_name?.trim() ? {} : { display_name: fullName }),
        })
        .eq('user_id', user.id)
    : await db.from('profiles').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: fullName,
      })
  if (result.error)
    return {
      error:
        'We couldn’t save your name. Try again, or email the club if it keeps happening.',
    }
  redirect(returnTo)
}
