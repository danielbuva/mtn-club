'use client'

import { useAdminViewer } from '@/components/admin/admin-view-frame'
import { GalleryDraftForm } from '@/components/gallery/gallery-draft-form'
import { LoadingField, LoadingValue } from './primitives'

export function GalleryLoading() {
  const viewer = useAdminViewer()
  return (
    <div className="mt-10 space-y-10">
      {!viewer || viewer.permissions['gallery.create'] ? (
        <GalleryDraftForm disabled />
      ) : null}
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Photo library</h2>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <LoadingValue className="w-6" /> total
          </div>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {[0, 1].map(row => (
            <article
              key={row}
              className="overflow-hidden border border-border bg-card"
            >
              <LoadingValue className="aspect-[16/9] h-auto w-full" />
              <div className="grid gap-4 p-5">
                <LoadingValue className="h-5 w-20 rounded-full" />
                <LoadingField label="Title" />
                <LoadingField label="Alternative text" multiline />
                <LoadingField label="Caption" multiline />
                <div className="grid gap-4 sm:grid-cols-2">
                  <LoadingField label="Trip" />
                  <LoadingField label="Date taken" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
