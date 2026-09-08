import { Suspense } from 'react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AnnouncementAdminEditor } from '@/components/announcements/announcement-admin-editor'
import { AnnouncementEditorLoading } from '@/components/announcements/announcement-editor-loading'
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <AdminPageHeader title="New announcement" />
      <Suspense fallback={<AnnouncementEditorLoading />}>
        <AnnouncementAdminEditor />
      </Suspense>
    </div>
  )
}
