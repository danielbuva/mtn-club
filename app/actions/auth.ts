'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { AUTH_CACHE_TAG, authUserTag } from '@/lib/auth/tags'
import { createClient } from '@/lib/supabase/server'

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id ?? null

  await supabase.auth.signOut()

  revalidateTag(AUTH_CACHE_TAG, 'default')
  if (userId) {
    revalidateTag(authUserTag(userId), 'default')
  }

  revalidatePath('/')
  revalidatePath('/profile')
  revalidatePath('/calendar')
  revalidatePath('/trips/new')
  revalidatePath('/membership')

  // Manual smoke test:
  // 1) Sign in, visit /profile and /calendar.
  // 2) Sign out, confirm redirect to / and header updates.
  // 3) Use back/forward and refresh; verify member-only UI is gone.
  redirect('/')
}
