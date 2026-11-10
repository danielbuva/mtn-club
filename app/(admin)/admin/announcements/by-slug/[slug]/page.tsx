import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AnnouncementEditorLoading } from '@/components/announcements/announcement-editor-loading'
import { requireAdminCapability } from '@/lib/admin/auth'
import { withReturnTo } from '@/lib/admin/site-pages'
import { sanitizeReturnTo } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ returnTo?: string }>
}

/** Public notice pages know their slug, not their id; this finds the editor. */
async function OpenEditor({ params, searchParams }: Props): Promise<never> {
  await requireAdminCapability('announcements.read')
  const [{ slug }, { returnTo }] = await Promise.all([params, searchParams])
  const client = await createClient()
  const { data, error } = await client
    .from('announcements')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (error)
    throw new Error('The editor could not be loaded. Please try again.')
  if (!data) notFound()
  const editor = `/admin/announcements/${data.id}`
  const back = sanitizeReturnTo(returnTo ?? null)
  return redirect(back ? withReturnTo(editor, back) : editor)
}

export default function Page(props: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <AdminPageHeader title="Edit announcement" />
      <Suspense fallback={<AnnouncementEditorLoading />}>
        <OpenEditor {...props} />
      </Suspense>
    </div>
  )
}
