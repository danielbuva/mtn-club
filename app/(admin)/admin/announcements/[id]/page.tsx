import { Suspense } from 'react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AnnouncementAdminEditor } from '@/components/announcements/announcement-admin-editor'
import { AnnouncementEditorLoading } from '@/components/announcements/announcement-editor-loading'

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AnnouncementAdminEditor id={id} />
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <AdminPageHeader title="Edit announcement" />
      <Suspense fallback={<AnnouncementEditorLoading />}>
        <Editor params={params} />
      </Suspense>
    </div>
  )
}
